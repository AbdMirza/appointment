const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all services for a business (Admin view - includes inactive)
const getServices = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        if (!businessId) {
            return res.status(400).json({ message: "User not associated with a business" });
        }

        const { search, status } = req.query;

        // Build where clause
        const where = {
            businessId,
            deletedAt: null, // Only non-deleted services
        };

        // Filter by status
        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const services = await prisma.service.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        // responds frontend
        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Error fetching services" });
    }
};

// only active services shown to cust
const getActiveServices = async (req, res) => {
    try {
        const { businessId } = req.params;

        if (!businessId) {
            return res.status(400).json({ message: "Business ID is required" });
        }

        const services = await prisma.service.findMany({
            where: {
                businessId,
                isActive: true,
                deletedAt: null,
            },
            orderBy: { name: "asc" },
        });

        res.json(services);
    } catch (error) {
        console.error("Error fetching active services:", error);
        res.status(500).json({ message: "Error fetching services" });
    }
};

// Get single service by ID
const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const service = await prisma.service.findFirst({
            where: {
                id,
                businessId,
                deletedAt: null,
            },
        });

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(service);
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({ message: "Error fetching service" });
    }
};

// Create a new service
const createService = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        if (!businessId) {
            return res.status(400).json({ message: "User not associated with a business" });
        }

        const { name, description, duration, price, bufferTimeBefore, bufferTimeAfter, isActive } = req.body;

        // Validation
        if (!name || !duration) {
            return res.status(400).json({ message: "Name and duration are required" });
        }

        if (duration < 1) {
            return res.status(400).json({ message: "Duration must be at least 1 minute" });
        }

        const service = await prisma.service.create({
            data: {
                name,
                description: description || null,
                duration: parseInt(duration),
                price: parseFloat(price) || 0,
                bufferTimeBefore: parseInt(bufferTimeBefore) || 0,
                bufferTimeAfter: parseInt(bufferTimeAfter) || 0,
                isActive: isActive !== undefined ? isActive : true,
                businessId,
            },
        });

        res.status(201).json(service);
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ message: "Error creating service" });
    }
};

// Update a service
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        // Check if service exists and belongs to this business
        const existingService = await prisma.service.findFirst({
            where: {
                id,
                businessId,
                deletedAt: null,
            },
        });

        if (!existingService) {
            return res.status(404).json({ message: "Service not found" });
        }

        const { name, description, duration, price, bufferTimeBefore, bufferTimeAfter, isActive } = req.body;

        // Validation
        if (name !== undefined && !name.trim()) {
            return res.status(400).json({ message: "Name cannot be empty" });
        }

        if (duration !== undefined && duration < 1) {
            return res.status(400).json({ message: "Duration must be at least 1 minute" });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (duration !== undefined) updateData.duration = parseInt(duration);
        if (price !== undefined) updateData.price = parseFloat(price) || 0;
        if (bufferTimeBefore !== undefined) updateData.bufferTimeBefore = parseInt(bufferTimeBefore) || 0;
        if (bufferTimeAfter !== undefined) updateData.bufferTimeAfter = parseInt(bufferTimeAfter) || 0;
        if (isActive !== undefined) updateData.isActive = isActive;

        const service = await prisma.service.update({
            where: { id },
            data: updateData,
        });

        res.json(service);
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Error updating service" });
    }
};

// Toggle service active status
const toggleServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const existingService = await prisma.service.findFirst({
            where: {
                id,
                businessId,
                deletedAt: null,
            },
        });

        if (!existingService) {
            return res.status(404).json({ message: "Service not found" });
        }

        const service = await prisma.service.update({
            where: { id },
            data: { isActive: !existingService.isActive },
        });

        res.json(service);
    } catch (error) {
        console.error("Error toggling service status:", error);
        res.status(500).json({ message: "Error toggling service status" });
    }
};

// Delete a service (soft delete)
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        // Check if service exists
        const existingService = await prisma.service.findFirst({
            where: {
                id,
                businessId,
                deletedAt: null,
            },
        });

        if (!existingService) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Check for future bookings
        const futureBookings = await prisma.booking.findFirst({
            where: {
                serviceId: id,
                startTime: { gte: new Date() },
                status: { not: "CANCELLED" },
            },
        });

        if (futureBookings) {
            return res.status(400).json({
                message: "Cannot delete service with future bookings. Please disable it instead.",
                hasFutureBookings: true,
            });
        }

        // Soft delete - set deletedAt timestamp
        await prisma.service.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });

        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ message: "Error deleting service" });
    }
};

module.exports = {
    getServices,
    getActiveServices,
    getServiceById,
    createService,
    updateService,
    toggleServiceStatus,
    deleteService,
};
