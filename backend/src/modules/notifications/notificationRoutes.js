const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const notificationController = require('./notificationController');

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
