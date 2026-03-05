const { catchAsync } = require('../../utils/controllerHelpers');
const { successResponse, errorResponse } = require('../../utils/responseHelpers');
const { generateAvailableSlots } = require('./slotEngine');

/**
 * GET /api/availability/slots
 * Public endpoint — no auth required
 * Query: businessId, serviceId, startDate, endDate, staffId (optional)
 */
exports.getAvailableSlots = catchAsync(async (req, res) => {
    const { businessId, serviceId, startDate, endDate, staffId } = req.query;

    if (!businessId || !serviceId || !startDate || !endDate) {
        return errorResponse(res, 'businessId, serviceId, startDate, and endDate are required', 400);
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return errorResponse(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }

    if (start > end) {
        return errorResponse(res, 'startDate cannot be after endDate', 400);
    }

    // Limit to max 31 days
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
        return errorResponse(res, 'Date range cannot exceed 31 days', 400);
    }

    const slots = await generateAvailableSlots({
        businessId,
        serviceId,
        startDate,
        endDate,
        staffId: staffId || undefined
    });

    return successResponse(res, slots);
});
