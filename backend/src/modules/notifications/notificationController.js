const prisma = require("../../utils/prisma");

// Get notifications for a user or business
exports.getNotifications = async (req, res) => {
    try {
        const { id: userId, businessId, role } = req.user;

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { businessId: businessId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating notification" });
    }
};
