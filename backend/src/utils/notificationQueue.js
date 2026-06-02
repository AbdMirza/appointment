const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { sendEmail } = require('./emailService');
const prisma = require('./prisma');
const { format } = require('date-fns');

// ─── Redis Connection ───────────────────────────────────────
let redisConnection = null;
let notificationQueue = null;
let redisAvailable = false;

redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy(times) {
        // Keep trying, but log it
        if (times % 5 === 0) {
            console.warn('⚠️ Redis: Connection retrying...');
        }
        return Math.min(times * 500, 3000);
    }
});

redisConnection.on('error', (err) => {
    redisAvailable = false;
});

redisConnection.on('connect', () => {
    redisAvailable = true;
    console.log('✅ Redis connected — Background job queue active.');
});

// Try to connect
redisConnection.connect().catch(() => {
    redisAvailable = false;
    console.error('❌ Redis not running. Notification queue disabled.');
});

// ─── Queue Setup ────────────────────────────────────────────
notificationQueue = new Queue('notificationQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
    }
});

// ─── Core Email Processing Logic ────────────────────────────
const processNotification = async (jobData) => {
    const { type, appointmentId, data } = jobData;
    console.log(`📧 Processing notification: ${type} for appointment ${appointmentId}`);

    const appointment = await prisma.booking.findUnique({
        where: { id: appointmentId },
        include: {
            user: true,
            service: {
                include: { business: true }
            },
            acceptedBy: true
        }
    });

    if (!appointment && type !== 'BOOKING_CANCELLED') {
        console.warn(`Appointment ${appointmentId} not found, skipping notification.`);
        return;
    }

    const businessName = appointment?.service?.business?.name || data?.businessName || 'Appointment System';
    const context = {
        customerName: appointment?.user?.name || data?.customerName || 'Customer',
        serviceName: appointment?.service?.name || data?.serviceName,
        businessName: businessName,
        date: appointment ? format(new Date(appointment.startTime), 'PPP') : data?.date,
        time: appointment ? format(new Date(appointment.startTime), 'p') : data?.time,
        staffName: appointment?.acceptedBy?.name,
        ...data
    };

    switch (type) {
        case 'BOOKING_CONFIRMED':
            await sendEmail(appointment.user.email, 'Booking Confirmed', 'booking-confirmed', context, businessName);
            break;
        case 'BOOKING_CANCELLED':
            await sendEmail(data.customerEmail, 'Booking Cancelled', 'booking-cancelled', context, businessName);
            break;
        case 'BOOKING_RESCHEDULED':
            await sendEmail(appointment.user.email, 'Appointment Rescheduled', 'booking-rescheduled', {
                ...context,
                oldDate: data.oldDate,
                oldTime: data.oldTime
            }, businessName);
            break;
        case 'REMINDER_24H':
        case 'REMINDER_2H':
            if (appointment.status !== 'CANCELLED' && appointment.status !== 'LATE_CANCELLED') {
                await sendEmail(appointment.user.email, 'Appointment Reminder', 'reminder', {
                    ...context,
                    hoursLeft: type === 'REMINDER_24H' ? 24 : 2
                }, businessName);
            }
            break;
        default:
            console.warn(`Unknown notification type: ${type}`);
    }
};

// ─── BullMQ Worker ──────────────────────────────────────────
const worker = new Worker('notificationQueue', async (job) => {
    await processNotification(job.data);
}, { connection: redisConnection });

worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

// ─── Public API ─────────────────────────────────────────────

/**
 * Add a notification job. 
 * STRICTLY uses Redis. If Redis is down, logs "redis not running".
 */
const addNotification = async (jobName, jobData) => {
    if (redisAvailable && notificationQueue) {
        try {
            await notificationQueue.add(jobName, jobData);
        } catch (err) {
            console.error('❌ Failed to add to queue:', err.message);
        }
    } else {
        console.log('redis not running');
    }
};

const scheduleReminders = async (appointment) => {
    if (!redisAvailable || !notificationQueue) {
        console.log('redis not running');
        return;
    }

    const startTime = new Date(appointment.startTime).getTime();
    const now = Date.now();

    const delay24h = startTime - (24 * 60 * 60 * 1000) - now;
    if (delay24h > 0) {
        await notificationQueue.add(`reminder-24h-${appointment.id}`, {
            type: 'REMINDER_24H',
            appointmentId: appointment.id
        }, {
            delay: delay24h,
            jobId: `reminder-24h-${appointment.id}`
        });
    }

    const delay2h = startTime - (2 * 60 * 60 * 1000) - now;
    if (delay2h > 0) {
        await notificationQueue.add(`reminder-2h-${appointment.id}`, {
            type: 'REMINDER_2H',
            appointmentId: appointment.id
        }, {
            delay: delay2h,
            jobId: `reminder-2h-${appointment.id}`
        });
    }
};

const cancelReminders = async (appointmentId) => {
    if (!redisAvailable || !notificationQueue) return;

    try {
        const jobs = await notificationQueue.getJobs(['delayed', 'waiting']);
        for (const job of jobs) {
            if (job.id === `reminder-24h-${appointmentId}` || job.id === `reminder-2h-${appointmentId}`) {
                await job.remove();
            }
        }
    } catch (err) {
        console.warn('Could not cancel reminders:', err.message);
    }
};

module.exports = {
    notificationQueue: { add: addNotification },
    scheduleReminders,
    cancelReminders
};
