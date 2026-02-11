const prisma = require("../../utils/prisma");

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const { serviceId, startTime, endTime } = req.body;
        const userId = req.user.id; // From auth middleware

        const booking = await prisma.booking.create({
            data: {
                userId,
                serviceId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status: "PENDING",
            },
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking" });
    }
};

// Get bookings for the logged-in customer
exports.getCustomerBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await prisma.booking.findMany({
            where: { userId },
            include: {
                service: {
                    include: {
                        business: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bookings" });
    }
};

// Get bookings for a business (Admin/Staff view)
exports.getBusinessBookings = async (req, res) => {
    try {
        const { businessId, role, id: userId } = req.user;
        let whereClause = { service: { businessId } };

        // Staff Restrictions: Only see CONFIRMED (unassigned) and ASSIGNED
        if (role === "STAFF") {
            whereClause.status = { in: ["CONFIRMED", "ASSIGNED"] };
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: {
                service: true,
                user: { select: { name: true, email: true } },
                acceptedBy: { select: { name: true } }
            },
            orderBy: { startTime: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching business bookings:", error);
        res.status(500).json({ message: "Error fetching business bookings" });
    }
};

// Update booking status (Confirm/Cancel/Assign)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { role, id: userId, businessId } = req.user;

        // Fetch current user if name is not in token (for older sessions)
        let userName = req.user.name;
        if (!userName) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });
            userName = currentUser?.name || "A staff member";
        }

        // Fetch current booking to check permissions
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { service: true, user: { select: { name: true } } }
        });


        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const updateData = { status };

        // Role-Based Logic for Status Transitions
        if (role === "BUSINESS_ADMIN") {
            // Admin can do anything (Approve, Cancel, etc.)
            // No specific restriction here for now
        } else if (role === "STAFF") {
            // Staff can only move from CONFIRMED -> ASSIGNED
            if (booking.status !== "CONFIRMED") {
                return res.status(403).json({ message: "Staff can only accept confirmed appointments." });
            }
            if (status !== "ASSIGNED") {
                return res.status(403).json({ message: "Staff can only move status to ASSIGNED." });
            }

            // --- CONFLICT CHECK ---
            // Check if this staff member already has an ASSIGNED booking that overlaps
            const overlapping = await prisma.booking.findFirst({
                where: {
                    acceptedById: userId,
                    status: "ASSIGNED",
                    OR: [
                        {
                            // New appointment starts during an existing one
                            startTime: { lt: booking.endTime },
                            endTime: { gt: booking.startTime }
                        }
                    ]
                }
            });

            if (overlapping) {
                return res.status(400).json({
                    message: "You already have another assignment at this time. Please check your schedule."
                });
            }
            // ----------------------

            updateData.acceptedById = userId;

        } else {
            return res.status(403).json({ message: "Unsupported role for this action." });
        }

        const updated = await prisma.booking.update({
            where: { id },
            data: updateData,
            include: {
                acceptedBy: { select: { name: true } },
                user: { select: { name: true } },
                service: { select: { name: true } }
            }
        });

        // Trigger notifications if assigned
        if (status === "ASSIGNED") {
            try {
                await prisma.notification.create({
                    data: {
                        title: "Service Accepted",
                        message: `${userName} will be providing service for ${updated.user.name} (${updated.service.name})`,
                        type: "APPOINTMENT_ASSIGNED",
                        businessId: businessId,
                    }
                });
            } catch (notifError) {
                console.error("Error creating notification:", notifError);
            }
        }

        res.json(updated);
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Error updating status" });
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const { businessId } = req.user;
        const count = await prisma.booking.count({
            where: {
                service: { businessId },
                status: "PENDING"
            }
        });
        res.json({ count });
    } catch (error) {
        console.error("Error fetching pending count:", error);
        res.status(500).json({ message: "Error fetching pending count" });
    }
};



