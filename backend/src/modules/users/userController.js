const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");

// Get all staff for the logged-in admin's business
exports.getStaff = asyncHandler(async (req, res) => {
    const staff = await prisma.user.findMany({
        where: {
            businessId: req.user.businessId,
            role: "STAFF"
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    res.json(staff);
});

// Add a new staff member
exports.addStaff = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
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

    res.status(201).json({
        message: "Staff member added successfully",
        staff: {
            id: newStaff.id,
            name: newStaff.name,
            email: newStaff.email,
            role: newStaff.role
        }
    });
});

// Remove a staff member
exports.removeStaff = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Ensure the staff belongs to the admin's business
    const staff = await prisma.user.findFirst({
        where: {
            id,
            businessId: req.user.businessId,
            role: "STAFF"
        }
    });

    if (!staff) {
        return res.status(404).json({ message: "Staff member not found in your business" });
    }

    await prisma.user.delete({
        where: { id }
    });

    res.json({ message: "Staff member removed successfully" });
});
