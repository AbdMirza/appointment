const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");

const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse, notFoundResponse, validationErrorResponse } = require("../../utils/responseHelpers");

// crudFactory removed as it is no longer used for self-service methods

/**
 * Get customers who have bookings with the admin's business
 * Role: BUSINESS_ADMIN
 */
exports.getBusinessCustomers = catchAsync(async (req, res) => {
    const businessId = req.user?.businessId;

    if (!businessId) {
        return errorResponse(res, "Business not found for this admin", 400);
    }

    // Find all customers who have at least one booking with a service from this business
    const customers = await prisma.user.findMany({
        where: {
            role: "CUSTOMER",
            deletedAt: null,
            bookings: {
                some: {
                    service: {
                        businessId: businessId
                    }
                }
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            bookings: {
                where: {
                    service: {
                        businessId: businessId
                    }
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    startTime: true,
                    status: true,
                    service: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return successResponse(res, customers);
});
/**
 * Get customer's own profile
 * Role: CUSTOMER
 */
exports.getProfile = catchAsync(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
        }
    });

    if (!user) {
        return notFoundResponse(res, "User");
    }

    return successResponse(res, user);
});

/**
 * Update customer's profile (name and/or email)
 * Role: CUSTOMER
 */
exports.updateProfile = catchAsync(async (req, res) => {
    const { name, email } = req.body;

    // At least one field must be provided
    if (!name && !email) {
        return validationErrorResponse(res, "At least one field (name or email) must be provided");
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser && existingUser.id !== req.user.id) {
            return validationErrorResponse(res, "Email already in use");
        }

        updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
        }
    });

    return successResponse(res, updatedUser, "Profile updated successfully");
});

/**
 * Change customer's password
 * Role: CUSTOMER
 */
exports.changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return validationErrorResponse(res, "Both current and new passwords are required");
    }

    // Validate new password strength
    if (newPassword.length < 6) {
        return validationErrorResponse(res, "New password must be at least 6 characters long");
    }

    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (!user) {
        return notFoundResponse(res, "User");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        return errorResponse(res, "Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
    });

    return successResponse(res, {}, "Password changed successfully");
});

/**
 * Soft delete customer's account
 * Role: CUSTOMER
 */
exports.deleteAccount = catchAsync(async (req, res) => {
    const userId = req.user.id;

    // Check for future bookings
    const futureBookings = await prisma.booking.findFirst({
        where: {
            userId,
            startTime: { gte: new Date() },
            status: { notIn: ["CANCELLED", "COMPLETED"] }
        }
    });

    if (futureBookings) {
        return errorResponse(res, "Cannot delete account with active future bookings. Please cancel them first.", 400);
    }

    // Soft delete - set deletedAt timestamp
    await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() }
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
        where: { userId }
    });

    return successResponse(res, {}, "Account deleted successfully");
});



