const prisma = require("../../utils/prisma");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse } = require("../../utils/responseHelpers");
const { startOfDay, endOfDay, subDays, format } = require("date-fns");

const buildBookingsPerDay = (bookings, days = 7) => {
    const statsByDay = {};
    for (let i = 0; i < days; i++) {
        const dateStr = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        statsByDay[dateStr] = 0;
    }
    bookings.forEach((b) => {
        const dateStr = format(b.startTime, "yyyy-MM-dd");
        if (statsByDay[dateStr] !== undefined) {
            statsByDay[dateStr]++;
        }
    });
    return Object.entries(statsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
};

const getBookingStats = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);

    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    const bookings = await prisma.booking.findMany({
        where: {
            service: { businessId },
            startTime: { gte: startDate, lte: endDate },
        },
        select: { startTime: true },
    });

    const bookingsPerDay = buildBookingsPerDay(bookings, days);

    const totalBookings = await prisma.booking.count({
        where: { service: { businessId } },
    });

    const cancelledBookings = await prisma.booking.count({
        where: {
            service: { businessId },
            status: { in: ["CANCELLED", "LATE_CANCELLED", "REJECTED"] },
        },
    });

    const cancellationRate =
        totalBookings > 0
            ? parseFloat(((cancelledBookings / totalBookings) * 100).toFixed(2))
            : 0;

    return successResponse(res, {
        bookingsPerDay,
        summary: { totalBookings, cancelledBookings, cancellationRate },
    });
});

const getDashboardStats = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [business, pendingCount, todayCount, totalBookings, cancelledBookings] =
        await Promise.all([
            prisma.business.findUnique({
                where: { id: businessId },
                include: { bookingConfig: true },
            }),
            prisma.booking.count({
                where: { service: { businessId }, status: "PENDING" },
            }),
            prisma.booking.count({
                where: {
                    service: { businessId },
                    startTime: { gte: todayStart, lte: todayEnd },
                },
            }),
            prisma.booking.count({ where: { service: { businessId } } }),
            prisma.booking.count({
                where: {
                    service: { businessId },
                    status: { in: ["CANCELLED", "LATE_CANCELLED", "REJECTED"] },
                },
            }),
        ]);

    const cancellationRate =
        totalBookings > 0
            ? parseFloat(((cancelledBookings / totalBookings) * 100).toFixed(2))
            : 0;

    return successResponse(res, {
        business,
        stats: { pendingCount, todayCount, totalBookings, cancellationRate },
    });
});

const getAdminBootstrapData = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const chartStart = startOfDay(subDays(now, 6));

    const [
        business,
        services,
        staff,
        pendingCount,
        todayCount,
        totalBookings,
        cancelledBookings,
        leaveRequests,
        customers,
        paymentSummary,
        recentPayments,
        chartBookings,
    ] = await Promise.all([
        prisma.business.findUnique({
            where: { id: businessId },
            include: {
                bookingConfig: true,
                businessHours: { orderBy: { dayOfWeek: "asc" } },
            },
        }),
        prisma.service.findMany({
            where: { businessId, deletedAt: null },
            orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
            where: { businessId, role: "STAFF", deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
            },
        }),
        prisma.booking.count({
            where: { service: { businessId }, status: "PENDING" },
        }),
        prisma.booking.count({
            where: {
                service: { businessId },
                startTime: { gte: todayStart, lte: todayEnd },
            },
        }),
        prisma.booking.count({ where: { service: { businessId } } }),
        prisma.booking.count({
            where: {
                service: { businessId },
                status: { in: ["CANCELLED", "LATE_CANCELLED", "REJECTED"] },
            },
        }),
        prisma.timeOff.findMany({
            where: { user: { businessId } },
            take: 50,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, email: true } } },
        }),
        prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                deletedAt: null,
                bookings: { some: { service: { businessId } } },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                bookings: {
                    where: { service: { businessId } },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        startTime: true,
                        status: true,
                        service: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        }),
        prisma.payment.findMany({
            where: { booking: { service: { businessId } } },
            select: { status: true, amount: true, refundAmount: true },
        }),
        prisma.payment.findMany({
            where: { booking: { service: { businessId } } },
            take: 50,
            orderBy: { createdAt: "desc" },
            include: {
                booking: {
                    include: { user: true, service: true },
                },
            },
        }),
        prisma.booking.findMany({
            where: {
                service: { businessId },
                startTime: { gte: chartStart, lte: todayEnd },
            },
            select: { startTime: true },
        }),
    ]);

    let totalRevenue = 0;
    let totalRefunds = 0;

    paymentSummary.forEach((p) => {
        const amt = Number(p.amount || 0);
        const ref = Number(p.refundAmount || 0);
        if (p.status === "PAID") {
            totalRevenue += amt;
        } else if (p.status === "REFUNDED") {
            totalRevenue += amt;
            totalRefunds += ref || amt;
        } else if (p.status === "PARTIALLY_REFUNDED") {
            totalRevenue += amt;
            totalRefunds += ref;
        }
    });

    const netIncome = totalRevenue - totalRefunds;

    const cancellationRate =
        totalBookings > 0
            ? parseFloat(((cancelledBookings / totalBookings) * 100).toFixed(2))
            : 0;

    return successResponse(res, {
        business,
        services,
        staff,
        leaveRequests,
        customers,
        finance: {
            totalRevenue,
            totalRefunds,
            netIncome,
            recentPayments,
        },
        stats: {
            pendingCount,
            todayCount,
            totalBookings,
            cancellationRate,
        },
        bookingsPerDay: buildBookingsPerDay(chartBookings, 7),
    });
});

module.exports = {
    getBookingStats,
    getDashboardStats,
    getAdminBootstrapData,
};
