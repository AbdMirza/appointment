const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');
const auditController = require('./auditController');

router.use(authenticateToken);
router.use(authorizeRoles('BUSINESS_ADMIN'));

router.get('/', auditController.getAuditLogs);

module.exports = router;
