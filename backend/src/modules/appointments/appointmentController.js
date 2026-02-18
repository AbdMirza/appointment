const prisma = require("../../utils/prisma");
const crudFactory = require("../../utils/crudFactory");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse, notFoundResponse } = require("../../utils/responseHelpers");

// Create the base CRUD operations for Booking
const bookingCRUD = crudFactory('booking', {
    include: {
        service: true,
        user: { select: { name: true, email: true } },
        acceptedBy: { select: { name: true } }
    },
    defaultOrderBy: { startTime: 'desc' }
});

// Create a new booking
exports.createBooking = catchAsync(async (req, res) => {
    const { serviceId, startTime, endTime } = req.body;
    const userId = req.user.id;

    const booking = await prisma.$transaction(async (tx) => {
        // 1. Fetch service and business hours
        const service = await tx.service.findUnique({
            where: { id: serviceId },
            include: { business: { include: { businessHours: true } } }
        });

        if (!service) throw new Error("Service not found");

        const start = new Date(startTime);
        const dayOfWeek = start.getDay();
        const hours = service.business.businessHours.find(h => h.dayOfWeek === dayOfWeek);

        if (hours) {
            if (!hours.isOpen) {
                throw new Error("Business is closed on this day");
            }

            const timeString = start.toTimeString().split(' ')[0].substring(0, 5); // "HH:mm"
            if (timeString < hours.startTime || timeString > hours.endTime) {
                throw new Error(`Business is only open between ${hours.startTime} and ${hours.endTime}`);
            }
        }

        return tx.booking.create({
            data: {
                userId,
                serviceId,
                startTime: start,
                endTime: new Date(endTime),
                status: "PENDING",
            },
        });
    });

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
                    business: { select: { name: true } }
                }
            }
        },
        orderBy: { startTime: 'desc' }
    });

    return successResponse(res, bookings);
});

// Get bookings for a business (Admin/Staff view)
exports.getBusinessBookings = catchAsync(async (req, res) => {
    const { businessId, role } = req.user;
    const { tab = 'upcoming', startDate, endDate } = req.query;

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
    if (role === "STAFF") {
        where.acceptedById = req.user.id;

        // For Upcoming, staff shouldn't see PENDING or CONFIRMED (unassigned)
        if (tab === 'upcoming' || !tab) {
            where.status = "ASSIGNED";
        }
    }


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
            acceptedBy: { select: { name: true } }
        },
        orderBy: { startTime: 'desc' },
        take: 100 // Safe limit
    });

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
        if (status === "ASSIGNED") {
            const { staffId } = req.body;
            if (!staffId) {
                return errorResponse(res, "Staff member must be selected for assignment", 400);
            }
            updateData.acceptedById = staffId;
        }
    } else if (role === "STAFF") {
        // Staff can no longer accept services (assigned by admin)
        if (status === "ASSIGNED") {
            return forbiddenResponse(res, "Staff cannot assign or accept services. This must be done by an Admin.");
        }

        // Staff cannot approve or cancel (Admin only)
        if (status === "CONFIRMED" || status === "CANCELLED") {
            return forbiddenResponse(res, `Only administrators can ${status === 'CONFIRMED' ? 'approve' : 'cancel'} appointments.`);
        }

        // Staff can mark as COMPLETED
        if (status !== "COMPLETED") {
            return forbiddenResponse(res, "Staff can only update status to COMPLETED.");
        }
    }


    const updated = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: bookingCRUD.include // Reuse factory includes
    });


    // Trigger notification
    if (status === "ASSIGNED") {
        try {
            await prisma.notification.create({
                data: {
                    title: "Service Accepted",
                    message: `${userName} will be providing service for ${updated.user.name} (${updated.service.name})`,
                    type: "APPOINTMENT_ASSIGNED",
                    businessId: businessId,
                }
            });
        } catch (notifError) {
            console.error("Error creating notification:", notifError);
        }
    }

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




