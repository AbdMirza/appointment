const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const { catchAsync, validateRequired, sanitizeUser } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse, notFoundResponse, validationErrorResponse } = require("../../utils/responseHelpers");

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

    const validation = validateRequired(['currentPassword', 'newPassword'], req.body);
    if (!validation.isValid) {
        return validationErrorResponse(res, validation.error);
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

/**
 * Get all customers who have booked with this business (Admin view)
 * Role: BUSINESS_ADMIN
 */
exports.getCustomers = catchAsync(async (req, res) => {
    const businessId = req.user.businessId;

    // Find all customers who have bookings for this business's services
    const customers = await prisma.user.findMany({
        where: {
            role: "CUSTOMER",
            deletedAt: null,
            bookings: {
                some: {
                    service: {
                        businessId
                    }
                }
            }
        },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            bookings: {
                where: {
                    service: {
                        businessId
                    }
                },
                select: {
                    id: true,
                    startTime: true,
                    status: true,
                    service: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: { startTime: 'desc' },
                take: 5 // Show only last 5 bookings per customer
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, customers);
});

/**
 * Get specific customer details (Admin view)
 * Role: BUSINESS_ADMIN
 */
exports.getCustomerById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId;

    const customer = await prisma.user.findFirst({
        where: {
            id,
            role: "CUSTOMER",
            deletedAt: null,
            bookings: {
                some: {
                    service: {
                        businessId
                    }
                }
            }
        },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            bookings: {
                where: {
                    service: {
                        businessId
                    }
                },
                include: {
                    service: {
                        select: {
                            name: true,
                            duration: true,
                            price: true
                        }
                    }
                },
                orderBy: { startTime: 'desc' }
            }
        }
    });

    if (!customer) {
        return notFoundResponse(res, "Customer");
    }

    return successResponse(res, customer);
});
