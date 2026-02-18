const prisma = require("../../utils/prisma");
const { catchAsync } = require("../../utils/controllerHelpers");
const { validationErrorResponse, successResponse, errorResponse, forbiddenResponse } = require("../../utils/responseHelpers");

// --- Working Hours ---

exports.getStaffSchedule = catchAsync(async (req, res) => {
    const { userId } = req.params;

    // Authorization: Staff can only see their own schedule, Admin can see any in business
    if (req.user.role === 'STAFF' && req.user.id !== userId) {
        return forbiddenResponse(res, "You can only view your own schedule");
    }

    const schedule = await prisma.workingHours.findMany({
        where: { userId },
        orderBy: { dayOfWeek: 'asc' }
    });

    return successResponse(res, schedule, "Staff schedule retrieved");
});

exports.updateStaffSchedule = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { schedule } = req.body; // Array of { dayOfWeek, startTime, endTime, breakStart, breakEnd }

    // Admin only for updating staff schedule? Requirements said staff can manage vacations, but schedule usually admin?
    // User request: "instead it should be created in the staff dashboard so that staff can add time-off date ranges"
    // I will leave schedule as is for now (admin only due to route middleware) but fix the userId check just in case.
    // Requirements: Admin manages schedule, Staff views it.
    if (req.user.role !== 'BUSINESS_ADMIN') {
        return forbiddenResponse(res, "Only administrators can update staff schedules");
    }

    // Use a transaction to update the schedule
    await prisma.$transaction(async (tx) => {
        // Delete existing schedule for this user
        await tx.workingHours.deleteMany({
            where: { userId }
        });

        // Create new schedule entries
        if (schedule && schedule.length > 0) {
            await tx.workingHours.createMany({
                data: schedule.map(item => ({
                    ...item,
                    userId,
                    businessId: req.user.businessId
                }))
            });
        }
    });

    const updatedSchedule = await prisma.workingHours.findMany({
        where: { userId },
        orderBy: { dayOfWeek: 'asc' }
    });

    return successResponse(res, updatedSchedule, "Staff schedule updated successfully");
});

// --- Time Off ---

exports.getStaffTimeOff = catchAsync(async (req, res) => {
    const { userId } = req.params;

    // Authorization: Staff can only see their own time-off
    if (req.user.role === 'STAFF' && req.user.id !== userId) {
        return forbiddenResponse(res, "You can only view your own time-off");
    }

    const timeOff = await prisma.timeOff.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' }
    });

    return successResponse(res, timeOff, "Staff time-off retrieved");
});

exports.addTimeOff = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Authorization: Staff can only add for themselves
    if (req.user.role === 'STAFF' && req.user.id !== userId) {
        return forbiddenResponse(res, "You can only request time-off for yourself");
    }

    const newTimeOff = await prisma.timeOff.create({
        data: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            userId,
            status: "PENDING" // Explicitly set pending
        }
    });

    return successResponse(res, newTimeOff, "Time off request submitted");
});

exports.deleteTimeOff = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Find the record first to check ownership
    const existing = await prisma.timeOff.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, "Time off record not found", 404);

    if (req.user.role === 'STAFF' && req.user.id !== existing.userId) {
        return forbiddenResponse(res, "You can only delete your own time-off requests");
    }

    // Optional: Only allow deleting if still PENDING? 
    // Usually staff can withdraw requests.

    await prisma.timeOff.delete({
        where: { id }
    });

    return successResponse(res, "Time off deleted successfully");
});

// --- Admin Only ---

exports.getAllStaffTimeOff = catchAsync(async (req, res) => {
    const { businessId } = req.user;

    const timeOff = await prisma.timeOff.findMany({
        where: {
            user: { businessId }
        },
        include: {
            user: {
                select: { name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, timeOff, "All staff time-off retrieved");
});

exports.updateTimeOffStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, DECLINED

    if (!['APPROVED', 'DECLINED'].includes(status)) {
        return validationErrorResponse(res, "Invalid status. Must be APPROVED or DECLINED.");
    }

    const updated = await prisma.timeOff.update({
        where: { id },
        data: { status },
        include: {
            user: { select: { name: true, email: true } }
        }
    });

    // Create notification for staff
    await prisma.notification.create({
        data: {
            title: `Time Off ${status.toLowerCase()}`,
            message: `Your time off request starting ${new Date(updated.startDate).toLocaleDateString()} has been ${status.toLowerCase()}.`,
            type: "LEAVE_STATUS_UPDATE",
            userId: updated.userId
        }
    });

    return successResponse(res, updated, `Time off ${status.toLowerCase()} successfully`);
});
