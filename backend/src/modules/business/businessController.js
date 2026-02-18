const prisma = require("../../utils/prisma");
const { catchAsync, validateRequired } = require("../../utils/controllerHelpers");
const { successResponse, notFoundResponse, validationErrorResponse } = require("../../utils/responseHelpers");

// Get business profile for logged-in admin
exports.getProfile = catchAsync(async (req, res) => {
    const business = await prisma.business.findUnique({
        where: { id: req.user.businessId }
    });

    if (!business) {
        return notFoundResponse(res, "Business");
    }

    return successResponse(res, business);
});

// Update business profile
exports.updateProfile = catchAsync(async (req, res) => {
    const { name, address, contact, timezone } = req.body;

    const validation = validateRequired(['name', 'address', 'contact', 'timezone'], req.body);
    if (!validation.isValid) {
        return validationErrorResponse(res, validation.error);
    }

    const updatedBusiness = await prisma.business.update({
        where: { id: req.user.businessId },
        data: { name, address, contact, timezone }
    });

    return successResponse(res, { business: updatedBusiness }, "Business profile updated successfully");
});

// Get all businesses (Public discovery)
exports.getBusinesses = catchAsync(async (req, res) => {
    const businesses = await prisma.business.findMany({
        where: {
            isActive: true,
            deletedAt: null
        },
        orderBy: { name: "asc" }
    });

    return successResponse(res, businesses);
});
