const express = require('express');
const router = express.Router();
const authRoutes = require('./modules/auth/authRoutes');
const userRoutes = require('./modules/users/userRoutes');
const businessRoutes = require('./modules/business/businessRoutes');
const servicesRoutes = require('./modules/services/servicesRoutes');
const appointmentRoutes = require('./modules/appointments/appointmentRoutes');
const notificationRoutes = require('./modules/notifications/notificationRoutes');
const customerRoutes = require('./modules/customers/customerRoutes');

router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

//  Mounting Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/business', businessRoutes);
router.use('/services', servicesRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/customers', customerRoutes);

module.exports = router;


