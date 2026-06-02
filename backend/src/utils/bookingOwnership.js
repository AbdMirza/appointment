const prisma = require('./prisma');
const { forbiddenResponse, notFoundResponse } = require('./responseHelpers');

/**
 * Load a booking and ensure it belongs to the user's business (admin/staff).
 * Customers must pass userId to verify they own the booking.
 */
const loadBookingWithBusinessCheck = async (bookingId, { businessId, userId, userRole, res }) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            user: { select: { name: true, email: true } },
            service: {
                include: {
                    business: {
                        include: { bookingConfig: true, businessHours: true }
                    }
                }
            },
            acceptedBy: { select: { name: true } },
            payment: true
        }
    });

    if (!booking) {
        notFoundResponse(res, 'Booking');
        return null;
    }

    if (userRole === 'CUSTOMER') {
        if (booking.userId !== userId) {
            forbiddenResponse(res, 'Access denied');
            return null;
        }
        return booking;
    }

    if (businessId && booking.service.businessId !== businessId) {
        forbiddenResponse(res, 'This booking does not belong to your business');
        return null;
    }

    return booking;
};

module.exports = { loadBookingWithBusinessCheck };
