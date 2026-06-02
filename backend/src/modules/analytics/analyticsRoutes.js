const express = require('express');
const router = express.Router();
const analyticsController = require('./analyticsController');
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');

router.use(authenticateToken);
router.use(authorizeRoles('BUSINESS_ADMIN'));

router.get('/stats', analyticsController.getBookingStats);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/bootstrap', analyticsController.getAdminBootstrapData);

module.exports = router;
