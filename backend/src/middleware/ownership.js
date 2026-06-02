const prisma = require('../utils/prisma');

/**
 * Ensures businessId in params/query/body matches the authenticated admin's business.
 */
const checkOwnership = (req, res, next) => {
    const userBusinessId = req.user.businessId;
    const resourceBusinessId = req.params.businessId || req.query.businessId || req.body.businessId;

    if (resourceBusinessId && resourceBusinessId !== userBusinessId) {
        return res.status(403).json({
            message: "Access denied. You do not have permission to access this business's data.",
        });
    }

    next();
};

/**
 * Ensures a service :id route param belongs to the admin's business.
 */
const checkServiceOwnership = async (req, res, next) => {
    if (!req.params.id) return next();

    const service = await prisma.service.findFirst({
        where: {
            id: req.params.id,
            businessId: req.user.businessId,
            deletedAt: null,
        },
    });

    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    req.service = service;
    next();
};

/**
 * Ensures a booking :id belongs to the user's business (admin/staff) or the customer owns it.
 */
const checkBookingOwnership = async (req, res, next) => {
    const { id } = req.params;
    const { businessId, id: userId, role } = req.user;

    const booking = await prisma.booking.findUnique({
        where: { id },
        select: { userId: true, service: { select: { businessId: true } } },
    });

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    if (role === 'CUSTOMER') {
        if (booking.userId !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
    } else if (businessId && booking.service.businessId !== businessId) {
        return res.status(403).json({ message: 'This booking does not belong to your business' });
    }

    req.bookingMeta = booking;
    next();
};

module.exports = {
    checkOwnership,
    checkServiceOwnership,
    checkBookingOwnership,
};
