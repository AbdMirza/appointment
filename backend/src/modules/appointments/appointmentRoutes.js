// const express = require('express');
// const router = express.Router();
// const { authenticateToken } = require('../../middleware/auth');
// const { authorizeRoles } = require('../../middleware/role');
// const appointmentController = require('./appointmentController');

// // Customer: Book an appointment
// router.post('/book', authenticateToken, authorizeRoles('CUSTOMER'), appointmentController.createBooking);

// // Customer: View my bookings
// router.get('/my-bookings', authenticateToken, authorizeRoles('CUSTOMER'), appointmentController.getCustomerBookings);

// // Admin/Staff: View all business appointments
// router.get('/business', authenticateToken, authorizeRoles('BUSINESS_ADMIN', 'STAFF'), appointmentController.getBusinessBookings);

// // Admin/Staff: Update status
// router.patch('/:id/status', authenticateToken, authorizeRoles('BUSINESS_ADMIN', 'STAFF'), appointmentController.updateBookingStatus);

// module.exports = router;