const prisma = require("../../utils/prisma");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse } = require("../../utils/responseHelpers");

// Get business hours for a specific business
exports.getBusinessHours = catchAsync(async (req, res) => {
    const businessId = req.params.businessId || req.user.businessId;

    const hours = await prisma.businessHours.findMany({
        where: { businessId },
        orderBy: { dayOfWeek: 'asc' }
    });

    return successResponse(res, hours, "Business hours retrieved successfully");
});

// Update business hours (Admin only)
exports.updateBusinessHours = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const { hours } = req.body; // Array of { dayOfWeek, startTime, endTime, isOpen }

    await prisma.$transaction(async (tx) => {
        // Delete existing for these days or all? Usually cleaner to replace all.
        await tx.businessHours.deleteMany({
            where: { businessId }
        });

        // Create new
        if (hours && hours.length > 0) {
            await tx.businessHours.createMany({
                data: hours.map(h => ({
                    ...h,
                    businessId
                }))
            });
        }
    });

    const updatedHours = await prisma.businessHours.findMany({
        where: { businessId },
        orderBy: { dayOfWeek: 'asc' }
    });

    return successResponse(res, updatedHours, "Business hours updated successfully");
});
