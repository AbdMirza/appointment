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
const { validateService, validateServiceUpdate } = require("../../middleware/validation");
const { checkServiceOwnership } = require("../../middleware/ownership");

// Public route - get active services for customers (by business ID)
router.get("/public/:businessId", getActiveServices);

// Protected routes - require authentication
router.use(authenticateToken);

// Admin-only routes
router.get("/", authorizeRoles("BUSINESS_ADMIN"), getServices);
router.get("/:id", authorizeRoles("BUSINESS_ADMIN"), checkServiceOwnership, getServiceById);
router.post("/", authorizeRoles("BUSINESS_ADMIN"), validateService, createService);
router.put("/:id", authorizeRoles("BUSINESS_ADMIN"), checkServiceOwnership, validateServiceUpdate, updateService);
router.patch("/:id/toggle", authorizeRoles("BUSINESS_ADMIN"), checkServiceOwnership, toggleServiceStatus);
router.delete("/:id", authorizeRoles("BUSINESS_ADMIN"), checkServiceOwnership, deleteService);

module.exports = router;
