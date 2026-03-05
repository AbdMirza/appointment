const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');
const { getAvailableSlots } = require('./availabilityController');
const { getBookingConfig, updateBookingConfig } = require('./bookingConfigController');

// Public — get available slots (customers browse before login)
router.get('/slots', getAvailableSlots);

// Admin only — booking config CRUD
router.get('/config', authenticateToken, authorizeRoles('BUSINESS_ADMIN'), getBookingConfig);
router.put('/config', authenticateToken, authorizeRoles('BUSINESS_ADMIN'), updateBookingConfig);

module.exports = router;
