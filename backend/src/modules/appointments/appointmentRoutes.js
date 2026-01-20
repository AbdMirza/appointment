const express = require('express');
const router = express.Router();

// ✅ Correct relative imports
const { authenticateToken } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/role');

// Customer books appointment
router.post('/book', authenticateToken, authorizeRoles('customer'), (req, res) => {
    res.json({ message: `Booking created by ${req.user.username}` });
});

// Admin/Staff can view all appointments
router.get('/all', authenticateToken, authorizeRoles('admin', 'staff'), (req, res) => {
    res.json({ message: "All appointments visible to admin and staff" });
});

module.exports = router;
