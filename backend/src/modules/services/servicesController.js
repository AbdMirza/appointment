const { Prisma } = require("@prisma/client");
const prisma = require("../../utils/prisma");
const crudFactory = require("../../utils/crudFactory");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse } = require("../../utils/responseHelpers");
const { logAudit } = require("../../utils/auditLogger");

// Create the base CRUD operations for Service model
const serviceCRUD = crudFactory('service', {
    searchFields: ['name', 'description'],
    validateFields: ['name', 'duration'],
    // Custom logic before delete: check for future bookings
    beforeDelete: async (id) => {
        const futureBookings = await prisma.booking.findFirst({
            where: {
                serviceId: id,
                startTime: { gte: new Date() },
                status: { not: "CANCELLED" },
            },
        });

        if (futureBookings) {
            return "Cannot delete service with future bookings. Please disable it instead.";
        }
        return true;
    },
    afterCreate: async (record, req) => {
        await logAudit({
            action: 'SERVICE_CREATE',
            entityType: 'SERVICE',
            entityId: record.id,
            actorId: req.user.id,
            actorRole: req.user.role,
            businessId: req.user.businessId,
            details: record
        });
    },
    afterUpdate: async (record, oldRecord, req) => {
        await logAudit({
            action: 'SERVICE_UPDATE',
            entityType: 'SERVICE',
            entityId: record.id,
            actorId: req.user.id,
            actorRole: req.user.role,
            businessId: req.user.businessId,
            details: {
                old: oldRecord,
                new: record
            }
        });
    },
    afterDelete: async (record, req) => {
        await logAudit({
            action: 'SERVICE_DELETE',
            entityType: 'SERVICE',
            entityId: record.id,
            actorId: req.user.id,
            actorRole: req.user.role,
            businessId: req.user.businessId,
            details: record
        });
    }
});

// Wrap create/update to handle Decimal and integer conversions
const createService = catchAsync(async (req, res) => {
    if (req.body.price) req.body.price = new Prisma.Decimal(req.body.price).toDecimalPlaces(2);

    if (req.body.duration) req.body.duration = parseInt(req.body.duration);
    if (req.body.bufferTimeBefore) req.body.bufferTimeBefore = parseInt(req.body.bufferTimeBefore);
    if (req.body.bufferTimeAfter) req.body.bufferTimeAfter = parseInt(req.body.bufferTimeAfter);

    return serviceCRUD.create(req, res);
});

const updateService = catchAsync(async (req, res) => {
    if (req.body.price) req.body.price = new Prisma.Decimal(req.body.price).toDecimalPlaces(2);

    if (req.body.duration) req.body.duration = parseInt(req.body.duration);
    if (req.body.bufferTimeBefore) req.body.bufferTimeBefore = parseInt(req.body.bufferTimeBefore);
    if (req.body.bufferTimeAfter) req.body.bufferTimeAfter = parseInt(req.body.bufferTimeAfter);

    return serviceCRUD.update(req, res);
});

// Custom: only active services shown to customers
const getActiveServices = catchAsync(async (req, res) => {
    const { businessId } = req.params;
    const services = await prisma.service.findMany({
        where: {
            businessId,
            isActive: true,
            deletedAt: null,
        },
        orderBy: { name: "asc" },
    });
    return successResponse(res, services);
});

// Custom: Toggle service active status
const toggleServiceStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const businessId = req.user.businessId;

    const existingService = await prisma.service.findFirst({
        where: { id, businessId, deletedAt: null },
    });

    if (!existingService) {
        return res.status(404).json({ message: "Service not found" });
    }

    const service = await prisma.service.update({
        where: { id },
        data: { isActive: !existingService.isActive },
    });

    await logAudit({
        action: 'SERVICE_TOGGLE',
        entityType: 'SERVICE',
        entityId: id,
        actorId: req.user.id,
        actorRole: req.user.role,
        businessId,
        details: { isActive: service.isActive, previous: existingService.isActive },
    });

    return successResponse(res, service);
});

module.exports = {
    getServices: serviceCRUD.getAll,
    getActiveServices,
    getServiceById: serviceCRUD.getOne,
    createService,
    updateService,
    toggleServiceStatus,
    deleteService: serviceCRUD.delete,
};

