const express = require("express");
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getUser, assignServices } = require("./userController");
const { getStaffSchedule, updateStaffSchedule, getStaffTimeOff, addTimeOff, deleteTimeOff, getAllStaffTimeOff, updateTimeOffStatus } = require("./staffScheduleController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// Auth middleware - All routes below require token
router.use(authenticateToken);

// --- Time Off management ---

// Literal Admin Routes FIRST (Must come before /:userId routes)
router.get("/time-off/all", authorizeRoles("BUSINESS_ADMIN"), getAllStaffTimeOff);
router.patch("/time-off/:id/status", authorizeRoles("BUSINESS_ADMIN"), updateTimeOffStatus);

// Shared/Parameterized Routes
router.get("/:userId/time-off", getStaffTimeOff);
router.post("/:userId/time-off", addTimeOff);
router.delete("/time-off/:id", deleteTimeOff);

// Staff Specific Routes (Internal authorization handles role checks)
router.get("/:userId/schedule", getStaffSchedule);
router.put("/:userId/schedule", updateStaffSchedule);

// --- Admin Only Routes ---
router.use(authorizeRoles("BUSINESS_ADMIN"));

// Generic User Management Routes (Use ?role=STAFF or ?role=CUSTOMER to filter)
router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser); // Added update capability
router.patch("/:id", updateUser);

router.delete("/:id", deleteUser);

// Staff Specific Admin Routes
router.patch("/:id/services", assignServices);


module.exports = router;
