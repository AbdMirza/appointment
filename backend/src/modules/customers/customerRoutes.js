const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getBusinessCustomers
} = require("./customerController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// Admin route: Get customers who have bookings with this business
router.get("/", authenticateToken, authorizeRoles("BUSINESS_ADMIN"), getBusinessCustomers);

// Customer self-service routes (require CUSTOMER role)
router.get("/profile", authenticateToken, authorizeRoles("CUSTOMER"), getProfile);
router.put("/profile", authenticateToken, authorizeRoles("CUSTOMER"), updateProfile);
router.patch("/password", authenticateToken, authorizeRoles("CUSTOMER"), changePassword);
router.delete("/account", authenticateToken, authorizeRoles("CUSTOMER"), deleteAccount);



module.exports = router;
