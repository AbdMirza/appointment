const express = require("express");
const router = express.Router();
const { getProfile, updateProfile } = require("./businessController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// All routes require authentication and BUSINESS_ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles("BUSINESS_ADMIN"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

module.exports = router;
