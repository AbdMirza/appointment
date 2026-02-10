const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, getBusinesses } = require("./businessController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// Public route for customer discovery
router.get("/public", getBusinesses);

// All routes require authentication and BUSINESS_ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles("BUSINESS_ADMIN"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

module.exports = router;
