const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const crudFactory = require("../../utils/crudFactory");
const { catchAsync } = require("../../utils/controllerHelpers");
const { validationErrorResponse, successResponse } = require("../../utils/responseHelpers");

// Create Generic CRUD operations for User (No hardcoded role filter)
const userCRUD = crudFactory('user', {
    searchFields: ['name', 'email'],
    select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        businessId: true, // Useful to see for Staff
        isActive: true,
        services: {

            select: {
                id: true,
                name: true,
                duration: true,
                price: true
            }
        }
    },
    defaultOrderBy: { createdAt: 'desc' },
    validateFields: ['name', 'email', 'password', 'role'] // Require role for creation
});

// Generic Get Users (Supports ?role=STAFF, ?role=CUSTOMER, search, etc.)
exports.getUsers = catchAsync(async (req, res) => {
    return userCRUD.getAll(req, res);
});

// Generic Get Single User
exports.getUser = catchAsync(async (req, res) => {
    return userCRUD.getOne(req, res);
});

// Generic Create User (Handles hashing and duplicate check)
exports.createUser = catchAsync(async (req, res) => {
    const { email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return validationErrorResponse(res, "Email already exists");
    }

    if (password) {
        req.body.password = await bcrypt.hash(password, 10);
    }

    // crudFactory handles businessId assignment based on req.user.businessId
    // and correctly skips it if role is CUSTOMER
    return userCRUD.create(req, res);
});

// Generic Update User
exports.updateUser = catchAsync(async (req, res) => {
    const { password } = req.body;

    // If updating password, hash it
    if (password) {
        req.body.password = await bcrypt.hash(password, 10);
    }

    return userCRUD.update(req, res);
});

// Generic Delete User (Soft delete handled by factory)
exports.deleteUser = catchAsync(async (req, res) => {
    return userCRUD.delete(req, res);
});

// Staff Specific: Assign Services
exports.assignServices = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { serviceIds } = req.body; // Array of UUIDs

    // Check if user exists and is a STAFF member
    const user = await prisma.user.findUnique({
        where: { id },
        select: { role: true, businessId: true }
    });

    if (!user || user.role !== 'STAFF') {
        return validationErrorResponse(res, "Only Staff members can have services assigned");
    }

    // Ensure services belong to the same business
    const services = await prisma.service.findMany({
        where: {
            id: { in: serviceIds },
            businessId: user.businessId
        }
    });

    if (services.length !== serviceIds.length) {
        return validationErrorResponse(res, "One or more services are invalid or belong to a different business");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            services: {
                set: serviceIds.map(id => ({ id }))
            }
        },
        include: {
            services: true
        }
    });

    return successResponse(res, updatedUser, "Services assigned successfully");
});

