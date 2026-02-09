const express = require("express");
const router = express.Router();
const {
    getServices,
    getActiveServices,
    getServiceById,
    createService,
    updateService,
    toggleServiceStatus,
    deleteService,
} = require("./servicesController");
const { authenticateToken } = require("../../middleware/auth");
const { authorizeRoles } = require("../../middleware/role");

// Public route - get active services for customers (by business ID)
router.get("/public/:businessId", getActiveServices);

// Protected routes - require authentication
router.use(authenticateToken);

// Admin-only routes
router.get("/", authorizeRoles("BUSINESS_ADMIN"), getServices);
router.get("/:id", authorizeRoles("BUSINESS_ADMIN"), getServiceById);
router.post("/", authorizeRoles("BUSINESS_ADMIN"), createService);
router.put("/:id", authorizeRoles("BUSINESS_ADMIN"), updateService);
router.patch("/:id/toggle", authorizeRoles("BUSINESS_ADMIN"), toggleServiceStatus);
router.delete("/:id", authorizeRoles("BUSINESS_ADMIN"), deleteService);

module.exports = router;
