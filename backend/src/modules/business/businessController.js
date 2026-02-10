const prisma = require("../../utils/prisma");
const asyncHandler = require("express-async-handler");

// Get business profile for logged-in admin
exports.getProfile = asyncHandler(async (req, res) => {
    const business = await prisma.business.findUnique({
        where: { id: req.user.businessId }
    });

    if (!business) {
        return res.status(404).json({ message: "Business not found" });
    }

    res.json(business);
});

// Update business profile
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, address, contact, timezone } = req.body;

    if (!name || !address || !contact || !timezone) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const updatedBusiness = await prisma.business.update({
        where: { id: req.user.businessId },
        data: { name, address, contact, timezone }
    });

    res.json({
        message: "Business profile updated successfully",
        business: updatedBusiness
    });
});
// Get all businesses (Public discovery)
exports.getBusinesses = asyncHandler(async (req, res) => {
    const businesses = await prisma.business.findMany({
        orderBy: { name: "asc" }
    });
    res.json(businesses);
});
