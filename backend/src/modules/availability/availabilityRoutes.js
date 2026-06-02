const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');
const { getAvailableSlots } = require('./availabilityController');
const { getBookingConfig, updateBookingConfig } = require('./bookingConfigController');
const { validateBookingConfig, validatePublicSlotsQuery } = require('../../middleware/validation');

// Public — get available slots (customers browse before login)
router.get('/slots', validatePublicSlotsQuery, getAvailableSlots);

// Admin only — booking config CRUD
router.get('/config', authenticateToken, authorizeRoles('BUSINESS_ADMIN'), getBookingConfig);
router.put('/config', authenticateToken, authorizeRoles('BUSINESS_ADMIN'), validateBookingConfig, updateBookingConfig);

module.exports = router;
