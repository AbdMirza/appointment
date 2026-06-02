const express = require('express');
const router = express.Router();
const authRoutes = require('./modules/auth/authRoutes');
const userRoutes = require('./modules/users/userRoutes');
const businessRoutes = require('./modules/business/businessRoutes');
const servicesRoutes = require('./modules/services/servicesRoutes');
const appointmentRoutes = require('./modules/appointments/appointmentRoutes');
const notificationRoutes = require('./modules/notifications/notificationRoutes');
const customerRoutes = require('./modules/customers/customerRoutes');
const availabilityRoutes = require('./modules/availability/availabilityRoutes');
const paymentRoutes = require('./modules/payments/paymentRoutes');

router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Invoice PDF download endpoint
router.get('/invoices/download/:filename', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    const filename = req.params.filename;
    // Sanitize: only allow alphanumeric, dash, underscore, and .pdf
    if (!/^[A-Za-z0-9_-]+\.pdf$/.test(filename)) {
        return res.status(400).json({ message: 'Invalid filename' });
    }
    const filePath = path.join(__dirname, '../public/invoices', filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Invoice not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    fs.createReadStream(filePath).pipe(res);
});

//  Mounting Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/business', businessRoutes);
router.use('/services', servicesRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/customers', customerRoutes);
router.use('/availability', availabilityRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', require('./modules/analytics/analyticsRoutes'));
router.use('/audit', require('./modules/audit/auditRoutes'));

module.exports = router;


