const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');
const {
    validateBooking,
    validateBookingStatus,
    validateBookingCancel,
} = require('../../middleware/validation');
const { checkBookingOwnership } = require('../../middleware/ownership');
const appointmentController = require('./appointmentController');

// Customer: Book an appointment
router.post('/book', authenticateToken, authorizeRoles('CUSTOMER'), validateBooking, appointmentController.createBooking);

// Customer: View my bookings
router.get('/my-bookings', authenticateToken, authorizeRoles('CUSTOMER'), appointmentController.getCustomerBookings);

// Admin/Staff: View all business appointments
router.get('/business', authenticateToken, authorizeRoles('BUSINESS_ADMIN', 'STAFF'), appointmentController.getBusinessBookings);

// Admin: Get pending count for sidebar badge
router.get('/pending-count', authenticateToken, authorizeRoles('BUSINESS_ADMIN'), appointmentController.getPendingCount);


// Admin/Staff/Customer: Manage status and cancellations
router.patch('/:id/status', authenticateToken, authorizeRoles('BUSINESS_ADMIN', 'STAFF'), checkBookingOwnership, validateBookingStatus, appointmentController.updateBookingStatus);
router.patch('/:id/cancel', authenticateToken, authorizeRoles('CUSTOMER', 'BUSINESS_ADMIN'), checkBookingOwnership, validateBookingCancel, appointmentController.cancelBooking);
router.patch('/:id/reschedule', authenticateToken, authorizeRoles('CUSTOMER'), checkBookingOwnership, validateBooking, appointmentController.rescheduleBooking);

module.exports = router;