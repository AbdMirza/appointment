const express = require('express');
const router = express.Router();

// Routes import
const authRoutes = require('../modules/auth/authRoutes');
const appointmentRoutes = require('../modules/appointments/appointmentRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;
