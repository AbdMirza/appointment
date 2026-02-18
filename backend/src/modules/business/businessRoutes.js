const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, getBusinesses } = require("./businessController");
const { getBusinessHours, updateBusinessHours } = require("./businessHoursController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// Public routes
router.get("/public", getBusinesses);
router.get("/public/:businessId/hours", getBusinessHours); // Using /public prefix for clarity

// Authenticated Business Admin routes
router.use(authenticateToken);
router.use(authorizeRoles("BUSINESS_ADMIN"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/hours", getBusinessHours); // Literal route handled first
router.put("/hours", updateBusinessHours);

module.exports = router;
