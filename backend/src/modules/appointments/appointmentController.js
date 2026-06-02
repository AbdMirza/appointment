const prisma = require("../../utils/prisma");
const crudFactory = require("../../utils/crudFactory");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require("../../utils/responseHelpers");
const { isStaffAvailable } = require("../../utils/availabilityUtils");
const { notificationQueue, scheduleReminders, cancelReminders } = require("../../utils/notificationQueue");
const { format } = require("date-fns");
const { createCheckoutSession, issueRefund } = require("../../utils/stripeService");
const { logAudit } = require("../../utils/auditLogger");


// Create the base CRUD operations for Booking
const bookingCRUD = crudFactory('booking', {
    include: {
        service: true,
        user: { select: { name: true, email: true } },
        acceptedBy: { select: { name: true } }
    },
    defaultOrderBy: { startTime: 'desc' }
});

// Create a new booking (with slot validation + optional staff assignment)
exports.createBooking = catchAsync(async (req, res) => {
    const { serviceId, startTime, endTime, staffId, phone, notes } = req.body;
    const userId = req.user.id;

    const booking = await prisma.$transaction(async (tx) => {
        // 1. Fetch service and business hours
        const service = await tx.service.findUnique({
            where: { id: serviceId },
            include: { business: { include: { businessHours: true } } }
        });

        if (!service) throw new Error("Service not found");

        const start = new Date(startTime);
        const timezone = service.business.timezone || 'UTC';
        
        const localDateStr = start.toLocaleDateString('en-US', { timeZone: timezone });
        const dayOfWeek = new Date(localDateStr).getDay();
        
        const hours = service.business.businessHours.find(h => h.dayOfWeek === dayOfWeek);

        if (hours) {
            if (!hours.isOpen) {
                throw new Error("Business is closed on this day");
            }

            const timeString = start.toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            if (timeString < hours.startTime || timeString > hours.endTime) {
                throw new Error(`Business is only open between ${hours.startTime} and ${hours.endTime}`);
            }
        }

        // 2. Check for conflicting bookings with the same staff
        if (staffId) {
            const availability = await isStaffAvailable(staffId, startTime, endTime);
            if (!availability.available) {
                throw new Error(availability.reason || "This staff member is not available at the selected time.");
            }
        }

        const newBooking = await tx.booking.create({
            data: {
                userId,

                serviceId,
                startTime: start,
                endTime: new Date(endTime),
                status: req.body.paymentMode === 'PAY_NOW' ? "AWAITING_PAYMENT" : "PENDING",
                ...(staffId && { acceptedById: staffId }),
                ...(phone && { phone }),
                ...(notes && { notes })
            },
            include: { service: true }
        });

        // Create initial Payment record
        await tx.payment.create({
            data: {
                bookingId: newBooking.id,
                amount: service.price,
                status: 'PENDING',
                paymentMethod: req.body.paymentMode === 'PAY_NOW' ? 'stripe' : 'cash'
            }
        });

        return newBooking;
    });

    // If Pay Now, create Stripe session and return URL
    if (req.body.paymentMode === 'PAY_NOW') {
        const session = await createCheckoutSession(booking);
        return successResponse(res, { booking, checkoutUrl: session.url }, "Payment required to confirm booking", 201);
    }

    try {
        if (booking.status === "ASSIGNED" || booking.status === "CONFIRMED") {
            await notificationQueue.add(`confirm-${booking.id}`, {
                type: 'BOOKING_CONFIRMED',
                appointmentId: booking.id
            });
            await scheduleReminders(booking);
        }
    } catch (notifErr) {
        console.error("Notification error (createBooking):", notifErr.message);
    }

    return successResponse(res, booking, "Booking created successfully", 201);
});

// Get bookings for the logged-in customer
exports.getCustomerBookings = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
        where: { userId },
        include: {
            service: {
                include: {
                    business: { 
                        include: { bookingConfig: true }
                    }
                }
            },
            acceptedBy: { select: { name: true } },
            payment: {
                include: { invoice: true }
            }
        },
        orderBy: { startTime: 'desc' }
    });


    return successResponse(res, bookings);
});

// Customer: Cancel their own booking
exports.cancelBooking = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isAdminOverride } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Find the booking with its service and business configuration
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            user: { select: { name: true, email: true } },
            service: {
                include: {
                    business: {
                        include: { bookingConfig: true }
                    }
                }
            }
        }
    });

    if (!booking) {
        return notFoundResponse(res, "Booking");
    }

    const business = booking.service.business;
    const config = business.bookingConfig || {
        cancellationDeadline: 24,
        lateCancelPolicy: 'ALLOW_LATE_MARK',
        refundPercentage: 50
    };

    // 2. Permission Check: Customer owns the booking OR admin of this business
    const isOwner = booking.userId === userId;
    const isAdmin =
        userRole === "BUSINESS_ADMIN" &&
        booking.service.businessId === req.user.businessId;

    if (!isOwner && !isAdmin) {
        return forbiddenResponse(res, "You can only cancel your own bookings.");
    }

    // 3. Policy Check: Only allow cancelling active bookings 
    const cancellableStatuses = ['PENDING', 'ASSIGNED', 'CONFIRMED'];
    if (!cancellableStatuses.includes(booking.status)) {
        return errorResponse(res, `Cannot cancel a booking that is already ${booking.status}.`, 400);
    }

    // 4. Policy Check: Time difference & Deadline
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const diffInHours = (startTime - now) / (1000 * 60 * 60);

    let finalStatus = 'CANCELLED';
    const skipDeadline = isAdminOverride && isAdmin;

    if (!skipDeadline && diffInHours < config.cancellationDeadline) {
        if (config.lateCancelPolicy === 'BLOCK' && !isAdmin) {
            return errorResponse(res, `Cancellations are only allowed at least ${config.cancellationDeadline} hours before the appointment.`, 400);
        } else {
            // Mark as late cancel if the policy allows it OR if user is an admin and didn't override
            finalStatus = 'LATE_CANCELLED';
        }
    }

    // 5. Update Status
    const updated = await prisma.booking.update({
        where: { id },
        data: { status: finalStatus },
        include: {
            service: {
                include: { business: { select: { name: true } } }
            },
            acceptedBy: { select: { name: true } },
            payment: true
        }
    });

    // 5.5 Handle Refund or Payment Cancellation
    if (updated.payment) {
        if (updated.payment.status === 'PAID' && updated.payment.stripePaymentId) {
            try {
                let refundAmount = null;
                if (finalStatus === 'LATE_CANCELLED') {
                    const refundPercent = config.refundPercentage || 50;
                    refundAmount = (Number(updated.payment.amount) * refundPercent) / 100;
                } else {
                    // Full refund
                    refundAmount = Number(updated.payment.amount);
                }

                await issueRefund(updated.payment.stripePaymentId, finalStatus === 'LATE_CANCELLED' ? refundAmount : null);
                
                await prisma.payment.update({
                    where: { id: updated.payment.id },
                    data: { 
                        status: finalStatus === 'LATE_CANCELLED' ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
                        refundAmount: refundAmount,
                        updatedAt: new Date()
                    }
                });
            } catch (refundErr) {
                console.error("Refund failed:", refundErr.message);
            }
        } else if (updated.payment.status === 'PENDING') {
            // Cancel unpaid payment
            await prisma.payment.update({
                where: { id: updated.payment.id },
                data: { 
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            });
        }
    }


    // 6. Trigger Email & Cancel Reminders
    try {
        const fullBooking = await prisma.booking.findUnique({
            where: { id },
            include: { user: true, service: true }
        });

        await notificationQueue.add(`cancel-${id}`, {
            type: 'BOOKING_CANCELLED',
            appointmentId: id,
            data: {
                customerEmail: fullBooking.user.email,
                customerName: fullBooking.user.name,
                serviceName: fullBooking.service.name,
                date: format(new Date(fullBooking.startTime), 'PPP'),
                time: format(new Date(fullBooking.startTime), 'p')
            }
        });

        await cancelReminders(id);
    } catch (notifErr) {
        console.error("Notification error (cancelBooking):", notifErr.message);
    }

    await logAudit({
        action: 'BOOKING_CANCEL',
        entityType: 'BOOKING',
        entityId: id,
        actorId: userId,
        actorRole: userRole,
        businessId: booking.service.businessId,
        details: { status: finalStatus, isLate: finalStatus === 'LATE_CANCELLED' }
    });

    return successResponse(res, updated, finalStatus === 'LATE_CANCELLED' ? "Booking marked as Late Cancelled" : "Booking cancelled successfully");
});

// Customer: Reschedule their booking
exports.rescheduleBooking = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { startTime, endTime, staffId } = req.body;
    const userId = req.user.id;

    // 1. Get current booking and its config
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            service: {
                include: {
                    business: { include: { bookingConfig: true, businessHours: true } }
                }
            }
        }
    });

    if (!booking) return notFoundResponse(res, "Booking");
    if (booking.userId !== userId) return forbiddenResponse(res, "Access denied");

    const config = booking.service.business.bookingConfig || { rescheduleDeadline: 12 };

    // 2. Policy Check: Deadline
    const now = new Date();
    const oldStart = new Date(booking.startTime);
    const diffInHours = (oldStart - now) / (1000 * 60 * 60);

    if (diffInHours < config.rescheduleDeadline) {
        return errorResponse(res, `Rescheduling is only allowed at least ${config.rescheduleDeadline} hours before the appointment.`, 400);
    }

    // 3. Validate new slot availability (Transaction)
    const updated = await prisma.$transaction(async (tx) => {
        const start = new Date(startTime);
        const service = booking.service;
        const timezone = service.business.timezone || 'UTC';
        
        const localDateStr = start.toLocaleDateString('en-US', { timeZone: timezone });
        const dayOfWeek = new Date(localDateStr).getDay();
        
        const hours = service.business.businessHours.find(h => h.dayOfWeek === dayOfWeek);

        // a. Open hours check
        if (hours) {
            if (!hours.isOpen) throw new Error("Business is closed on this day");
            const timeString = start.toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            if (timeString < hours.startTime || timeString > hours.endTime) {
                throw new Error(`Business is only open between ${hours.startTime} and ${hours.endTime}`);
            }
        }

        // b. Conflicting bookings check (Excluding current booking itself)
        const conflictStaffId = staffId || booking.acceptedById;
        if (conflictStaffId) {
            const availability = await isStaffAvailable(conflictStaffId, startTime, endTime, id);
            if (!availability.available) {
                throw new Error(availability.reason || "This time slot is no longer available.");
            }
        }

        // c. Update the booking
        return tx.booking.update({
            where: { id },
            data: {
                startTime: start,
                endTime: new Date(endTime),
                status: "PENDING", // Optionally reset to PENDING if rescheduled
                ...(staffId && { acceptedById: staffId })
            },
            include: {
                service: { include: { business: { select: { name: true } } } },
                acceptedBy: { select: { name: true } }
            }
        });
    });

    // 4. Trigger Reschedule Notification
    try {
        await notificationQueue.add(`reschedule-${id}-${Date.now()}`, {
            type: 'BOOKING_RESCHEDULED',
            appointmentId: id,
            data: {
                oldDate: format(new Date(booking.startTime), 'PPP'),
                oldTime: format(new Date(booking.startTime), 'p')
            }
        });

        // Update reminders
        await cancelReminders(id);
        await scheduleReminders(updated);
    } catch (notifErr) {
        console.error("Notification error (rescheduleBooking):", notifErr.message);
    }

    await logAudit({
        action: 'BOOKING_RESCHEDULE',
        entityType: 'BOOKING',
        entityId: id,
        actorId: userId,
        actorRole: req.user.role,
        businessId: booking.service.businessId,
        details: {
            oldStart: booking.startTime,
            newStart: updated.startTime,
        },
    });

    return successResponse(res, updated, "Booking rescheduled successfully");
});

// Get bookings for a business (Admin/Staff view)
exports.getBusinessBookings = catchAsync(async (req, res) => {
    const { businessId, role } = req.user;
    const { tab = 'upcoming', startDate, endDate, staffId, serviceId } = req.query;

    // Base query logic
    const where = { service: { businessId } };

    // 1. Tab-based filtering
    const now = new Date();
    if (tab === 'upcoming') {
        where.status = { in: ["PENDING", "CONFIRMED", "ASSIGNED"] };
        // Use start of today so appointments booked for today still appear
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        where.startTime = { gte: startOfToday };
    } else if (tab === 'past') {
        where.status = "COMPLETED";
    } else if (tab === 'cancelled') {
        where.status = { in: ["CANCELLED", "REJECTED"] };
    }

    // 2. Date Range filtering (overrides tab logic if provided)
    if (startDate || endDate) {
        where.startTime = {};
        if (startDate) where.startTime.gte = new Date(startDate);
        if (endDate) where.startTime.lte = new Date(endDate);
    } else if (!tab || tab === 'all') {
        // Default to last 30 days if no range or specific tab
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        where.startTime = { gte: thirtyDaysAgo };
    }

    // 3. Role-based restrictions
    // Staff can ONLY see bookings that admin has confirmed/assigned to them
    // PENDING and CANCELLED bookings are invisible to staff
    if (role === "STAFF") {
        where.acceptedById = req.user.id;
        
        const staffAllowedStatuses = ["CONFIRMED", "ASSIGNED", "COMPLETED"];
        
        if (where.status) {
            // Respect the tab's status filter, but filter by staff allowed list
            if (typeof where.status === 'string') {
                if (!staffAllowedStatuses.includes(where.status)) {
                    where.status = { in: [] }; // Status not allowed for staff
                }
            } else if (where.status.in) {
                where.status.in = where.status.in.filter(s => staffAllowedStatuses.includes(s));
            }
        } else {
            // Default (tab 'all') should only show staff allowed statuses
            where.status = { in: staffAllowedStatuses };
        }
    }

    // 4. Additional Filters (Admin only or generic)
    if (staffId) where.acceptedById = staffId;
    if (serviceId) where.serviceId = serviceId;


    // Spread filters directly into req.query so crudFactory picks them up as top-level fields
    // delete req.query.tab;
    // Object.assign(req.query, where);

    // return bookingCRUD.getAll(req, res);

    // DIRECT PRISMA QUERY (Bypassing crudFactory for reliability)
    const bookings = await prisma.booking.findMany({
        where,
        include: {
            service: true,
            user: { select: { name: true, email: true } },
            acceptedBy: { select: { name: true } },
            payment: true
        },
        orderBy: { startTime: 'desc' },
        take: 100 // Safe limit
    });

    // Include phone and notes in response for admin/staff visibility
    // These are already part of the booking model, Prisma returns them by default

    return successResponse(res, bookings);
});



// Update booking status (Confirm/Cancel/Assign)
exports.updateBookingStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId, businessId } = req.user;

    // Fetch current user name
    let userName = req.user.name;
    if (!userName) {
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });
        userName = currentUser?.name || "A staff member";
    }

    // Fetch booking to check permissions
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { service: true, user: { select: { name: true } } }
    });

    if (!booking) {
        return notFoundResponse(res, "Booking");
    }

    const updateData = { status };

    // Role-Based Logic
    if (role === "BUSINESS_ADMIN") {
        const { staffId } = req.body;
        
        // If staff member is provided (for assignment or reassignment)
        if (staffId) {
            const availability = await isStaffAvailable(staffId, booking.startTime, booking.endTime, id);
            if (!availability.available) {
                return errorResponse(res, `Staff member unavailable: ${availability.reason}`, 400);
            }
            updateData.acceptedById = staffId;
            
            // If changing staff, automatically set status to ASSIGNED if it was PENDING
            if (status === "PENDING") {
                updateData.status = "ASSIGNED";
            }
        } else if (status === "ASSIGNED") {
            return errorResponse(res, "Staff member must be selected for assignment", 400);
        }

        // Administrative block: Admins cannot mark bookings as COMPLETED (Staff duty)
        if (status === "COMPLETED") {
            return forbiddenResponse(res, "Only the assigned staff member can mark an appointment as completed.");
        }
        // Admin can set other statuses like NO_SHOW, CANCELLED, etc. freely
    } else if (role === "STAFF") {
        // Staff can only update bookings assigned to them
        if (booking.acceptedById !== userId) {
            return forbiddenResponse(res, "You can only update appointments assigned to you.");
        }

        // Staff can mark as COMPLETED or NO_SHOW
        if (status !== "COMPLETED" && status !== "NO_SHOW") {
            return forbiddenResponse(res, "Staff can only update status to COMPLETED or NO_SHOW.");
        }

        // Time Check: Staff can only mark completed/no-show after the appointment ends
        if (new Date() < new Date(booking.endTime)) {
            return errorResponse(res, `You can only mark this appointment as ${status} after its scheduled end time (${format(new Date(booking.endTime), 'p')}).`, 400);
        }
        
        // Staff cannot approve or cancel (Admin only)
        if (status === "CONFIRMED" || status === "CANCELLED") {
            return forbiddenResponse(res, `Only administrators can ${status === 'CONFIRMED' ? 'approve' : 'cancel'} appointments.`);
        }
    }


    const updated = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
            service: true,
            user: { select: { name: true, email: true } },
            acceptedBy: { select: { name: true } }
        }
    });


    // Trigger notification
    if (status === "ASSIGNED" || status === "CONFIRMED") {
        try {
            await prisma.notification.create({
                data: {
                    title: status === "CONFIRMED" ? "Booking Confirmed" : "Service Accepted",
                    message: status === "CONFIRMED" 
                        ? `Appointment for ${updated.user.name} on ${updated.startTime.toDateString()} has been confirmed.`
                        : `${userName} will be providing service for ${updated.user.name} (${updated.service.name})`,
                    type: status === "CONFIRMED" ? "APPOINTMENT_CONFIRMED" : "APPOINTMENT_ASSIGNED",
                    businessId: businessId,
                }
            });
        } catch (notifError) {
            console.error("Error creating notification:", notifError);
        }
    }

    // Trigger External Notifications (Email + Jobs)
    try {
        if (status === "CONFIRMED" || status === "ASSIGNED") {
            await notificationQueue.add(`confirm-${id}`, {
                type: 'BOOKING_CONFIRMED',
                appointmentId: id
            });
            await scheduleReminders(updated);
        } else if (status === "CANCELLED" || status === "REJECTED") {
            await notificationQueue.add(`cancel-${id}`, {
                type: 'BOOKING_CANCELLED',
                appointmentId: id,
                data: {
                    customerEmail: updated.user.email,
                    customerName: updated.user.name,
                    serviceName: updated.service.name,
                    date: format(new Date(updated.startTime), 'PPP'),
                    time: format(new Date(updated.startTime), 'p')
                }
            });
            await cancelReminders(id);
        }
    } catch (notifErr) {
        console.error("Notification error (updateStatus):", notifErr.message);
    }

    await logAudit({
        action: 'BOOKING_STATUS_UPDATE',
        entityType: 'BOOKING',
        entityId: id,
        actorId: userId,
        actorRole: role,
        businessId: businessId,
        details: { oldStatus: booking.status, newStatus: status, staffId: req.body.staffId }
    });

    return successResponse(res, updated, `Booking status updated to ${status}`);
});

exports.getPendingCount = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const count = await prisma.booking.count({
        where: {
            service: { businessId },
            status: "PENDING"
        }
    });
    return successResponse(res, { count });
});




