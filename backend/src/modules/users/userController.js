const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const { catchAsync, validateRequired } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse, notFoundResponse, validationErrorResponse } = require("../../utils/responseHelpers");

// Get all staff for the logged-in admin's business
exports.getStaff = catchAsync(async (req, res) => {
    const staff = await prisma.user.findMany({
        where: {
            businessId: req.user.businessId,
            role: "STAFF",
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    return successResponse(res, staff);
});

// Add a new staff member
exports.addStaff = catchAsync(async (req, res) => {
    const { name, email, password } = req.body;

    const validation = validateRequired(['name', 'email', 'password'], req.body);
    if (!validation.isValid) {
        return validationErrorResponse(res, validation.error);
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return validationErrorResponse(res, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "STAFF",
            businessId: req.user.businessId
        }
    });

    return successResponse(res, {
        staff: {
            id: newStaff.id,
            name: newStaff.name,
            email: newStaff.email,
            role: newStaff.role
        }
    }, "Staff member added successfully", 201);
});

// Remove a staff member
exports.removeStaff = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Ensure the staff belongs to the admin's business
    const staff = await prisma.user.findFirst({
        where: {
            id,
            businessId: req.user.businessId,
            role: "STAFF",
            deletedAt: null
        }
    });

    if (!staff) {
        return notFoundResponse(res, "Staff member not found in your business");
    }

    await prisma.user.delete({
        where: { id }
    });

    return successResponse(res, {}, "Staff member removed successfully");
});
