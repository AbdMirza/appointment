const express = require('express');
const router = express.Router();
const paymentController = require('./paymentController');
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');


// Protected routes
router.use(authenticateToken);

router.get('/report', authorizeRoles('BUSINESS_ADMIN'), paymentController.getFinanceReport);
router.post('/retry/:bookingId', authorizeRoles('CUSTOMER'), paymentController.createRetrySession);
router.post('/confirm', authorizeRoles('CUSTOMER'), paymentController.confirmSession);


module.exports = router;
