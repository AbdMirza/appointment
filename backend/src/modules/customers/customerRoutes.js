const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getCustomers,
    getCustomerById
} = require("./customerController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// Customer self-service routes (require CUSTOMER role)
router.get("/profile", authenticateToken, authorizeRoles("CUSTOMER"), getProfile);
router.put("/profile", authenticateToken, authorizeRoles("CUSTOMER"), updateProfile);
router.patch("/password", authenticateToken, authorizeRoles("CUSTOMER"), changePassword);
router.delete("/account", authenticateToken, authorizeRoles("CUSTOMER"), deleteAccount);

// Admin routes - view customers who booked with this business
router.get("/", authenticateToken, authorizeRoles("BUSINESS_ADMIN"), getCustomers);
router.get("/:id", authenticateToken, authorizeRoles("BUSINESS_ADMIN"), getCustomerById);

module.exports = router;
