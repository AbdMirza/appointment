const prisma = require('../../utils/prisma');
const { catchAsync } = require('../../utils/controllerHelpers');
const { successResponse, errorResponse } = require('../../utils/responseHelpers');

/**
 * GET /api/availability/config
 * Admin only — returns booking config for the admin's business
 * Auto-creates defaults if none exists
 */
exports.getBookingConfig = catchAsync(async (req, res) => {
    const { businessId } = req.user;

    if (!businessId) {
        return errorResponse(res, 'No business associated with this account', 400);
    }

    let config = await prisma.bookingConfig.findUnique({
        where: { businessId }
    });

    // Auto-create with defaults if none exists
    if (!config) {
        config = await prisma.bookingConfig.create({
            data: {
                businessId,
                slotInterval: 15,
                minBookingNotice: 120,
                maxBookingWindow: 30
            }
        });
    }

    return successResponse(res, config);
});

/**
 * PUT /api/availability/config
 * Admin only — update booking config
 */
exports.updateBookingConfig = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const { slotInterval, minBookingNotice, maxBookingWindow } = req.body;

    if (!businessId) {
        return errorResponse(res, 'No business associated with this account', 400);
    }

    // Validate inputs
    if (slotInterval !== undefined && (slotInterval < 5 || slotInterval > 120)) {
        return errorResponse(res, 'Slot interval must be between 5 and 120 minutes', 400);
    }
    if (minBookingNotice !== undefined && (minBookingNotice < 0 || minBookingNotice > 10080)) {
        return errorResponse(res, 'Min booking notice must be between 0 and 10080 minutes (7 days)', 400);
    }
    if (maxBookingWindow !== undefined && (maxBookingWindow < 1 || maxBookingWindow > 365)) {
        return errorResponse(res, 'Max booking window must be between 1 and 365 days', 400);
    }

    const config = await prisma.bookingConfig.upsert({
        where: { businessId },
        update: {
            ...(slotInterval !== undefined && { slotInterval }),
            ...(minBookingNotice !== undefined && { minBookingNotice }),
            ...(maxBookingWindow !== undefined && { maxBookingWindow })
        },
        create: {
            businessId,
            slotInterval: slotInterval ?? 15,
            minBookingNotice: minBookingNotice ?? 120,
            maxBookingWindow: maxBookingWindow ?? 30
        }
    });

    return successResponse(res, config, 'Booking configuration updated');
});
