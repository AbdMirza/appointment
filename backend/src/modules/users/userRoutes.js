const express = require("express");
const router = express.Router();
const { getStaff, addStaff, removeStaff } = require("./userController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// All routes here require authentication and being a BUSINESS_ADMIN
router.use(authenticateToken);
router.use(authorizeRoles("BUSINESS_ADMIN"));

router.get("/staff", getStaff);
router.post("/staff", addStaff);
router.delete("/staff/:id", removeStaff);

module.exports = router;
