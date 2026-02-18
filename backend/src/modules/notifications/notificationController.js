const prisma = require("../../utils/prisma");
const crudFactory = require("../../utils/crudFactory");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse } = require("../../utils/responseHelpers");

// Create the base CRUD for Notification
const notificationCRUD = crudFactory('notification', {
    defaultOrderBy: { createdAt: 'desc' }
});

// Get notifications for a user or business
exports.getNotifications = catchAsync(async (req, res) => {
    const { id: userId, businessId } = req.user;

    // Custom filter: either personal or business-wide
    req.query.OR = [
        { userId: userId },
        { businessId: businessId }
    ];

    // Limits
    req.query.take = 20;

    return notificationCRUD.getAll(req, res);
});

// Mark notification as read
exports.markAsRead = catchAsync(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });

    return successResponse(res, notification, "Notification marked as read");
});

