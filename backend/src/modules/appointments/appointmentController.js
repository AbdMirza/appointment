// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // Create a new booking
// exports.createBooking = async (req, res) => {
//     try {
//         const { serviceId, startTime, endTime } = req.body;
//         const userId = req.user.id; // From auth middleware

//         const booking = await prisma.booking.create({
//             data: {
//                 userId,
//                 serviceId,
//                 startTime: new Date(startTime),
//                 endTime: new Date(endTime),
//                 status: "PENDING",
//             },
//         });

//         res.status(201).json(booking);
//     } catch (error) {
//         console.error("Error creating booking:", error);
//         res.status(500).json({ message: "Error creating booking" });
//     }
// };

// // Get bookings for the logged-in customer
// exports.getCustomerBookings = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const bookings = await prisma.booking.findMany({
//             where: { userId },
//             include: { service: true },
//             orderBy: { startTime: 'desc' }
//         });
//         res.json(bookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching bookings" });
//     }
// };

// // Get bookings for a business (Admin/Staff view)
// exports.getBusinessBookings = async (req, res) => {
//     try {
//         const businessId = req.user.businessId;
//         const bookings = await prisma.booking.findMany({
//             where: {
//                 service: { businessId }
//             },
//             include: { 
//                 service: true,
//                 user: { select: { name: true, email: true } }
//             },
//             orderBy: { startTime: 'desc' }
//         });
//         res.json(bookings);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching business bookings" });
//     }
// };

// // Update booking status (Confirm/Cancel)
// exports.updateBookingStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;
//         const updated = await prisma.booking.update({
//             where: { id },
//             data: { status }
//         });
//         res.json(updated);
//     } catch (error) {
//         res.status(500).json({ message: "Error updating status" });
//     }
// };