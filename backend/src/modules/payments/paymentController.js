const prisma = require("../../utils/prisma");
const { stripe, createCheckoutSession } = require("../../utils/stripeService");
const { generateInvoicePDF } = require("../../utils/invoiceService");
const { catchAsync } = require("../../utils/controllerHelpers");
const { successResponse, errorResponse } = require("../../utils/responseHelpers");

/**
 * Handle Stripe Webhook
 */
exports.handleWebhook = catchAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (!stripe || !webhookSecret) {
        console.error("Stripe Webhook Error: Stripe or Webhook Secret not configured.");
        return res.status(400).send("Webhook not configured on server.");
    }

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {

        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSuccessfulPayment(session);
            break;
        case 'charge.refunded':
            const refund = event.data.object;
            await handleRefund(refund);
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

/**
 * Helper to handle successful payment from Stripe
 */
async function handleSuccessfulPayment(session) {
    const bookingId = session.metadata.bookingId;
    const stripePaymentId = session.payment_intent;

    // Check if already processed to be idempotent and safe
    const existingPayment = await prisma.payment.findUnique({
        where: { bookingId }
    });
    if (existingPayment && existingPayment.status === 'PAID') {
        console.log(`Payment for booking ${bookingId} already processed.`);
        return existingPayment;
    }

    const payment = await prisma.payment.update({
        where: { bookingId },
        data: {
            status: 'PAID',
            stripePaymentId,
            updatedAt: new Date(),
        },
        include: {
            booking: {
                include: {
                    user: true,
                    service: true
                }
            }
        }
    });

    // Generate Invoice
    const invoiceFileName = await generateInvoicePDF(payment);
    const invoiceNumber = `INV-${payment.id.substring(0, 8).toUpperCase()}`;

    await prisma.invoice.create({
        data: {
            paymentId: payment.id,
            invoiceNumber,
            pdfUrl: `/invoices/${invoiceFileName}`,
        }
    });

    // Update booking status to PENDING (from AWAITING_PAYMENT)
    await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'PENDING' }
    });

    return payment;
}

/**
 * Helper to handle refund from Stripe
 */
async function handleRefund(charge) {
    const stripePaymentId = charge.payment_intent;
    
    const payment = await prisma.payment.findUnique({
        where: { stripePaymentId }
    });

    if (payment) {
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: charge.refunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
                updatedAt: new Date(),
            }
        });
    }
}

/**
 * Get financial report for Admin
 */
exports.getFinanceReport = catchAsync(async (req, res) => {
    const { businessId } = req.user;

    const payments = await prisma.payment.findMany({
        where: { booking: { service: { businessId } } },
        include: {
            booking: {
                include: {
                    service: true,
                    user: { select: { name: true, email: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    let totalRevenue = 0;
    let totalRefunds = 0;

    payments.forEach((p) => {
        const amt = Number(p.amount || 0);
        const ref = Number(p.refundAmount || 0);
        if (p.status === "PAID") {
            totalRevenue += amt;
        } else if (p.status === "REFUNDED") {
            totalRevenue += amt;
            totalRefunds += ref || amt;
        } else if (p.status === "PARTIALLY_REFUNDED") {
            totalRevenue += amt;
            totalRefunds += ref;
        }
    });

    const netIncome = totalRevenue - totalRefunds;

    return successResponse(res, {
        totalRevenue,
        totalRefunds,
        netIncome,
        recentPayments: payments.slice(0, 50).map(p => ({
            ...p,
            refundAmount: p.refundAmount ? Number(p.refundAmount) : 
                         (p.status === 'PARTIALLY_REFUNDED' ? (Number(p.amount) * 0.5) : 
                         (p.status === 'REFUNDED' ? Number(p.amount) : 0))
        }))
    });
});

/**
 * Create a new checkout session for an existing AWAITING_PAYMENT booking
 */
exports.createRetrySession = catchAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { service: true }
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId !== userId) return res.status(403).json({ message: "Access denied" });
    if (booking.status !== 'AWAITING_PAYMENT') {
        return res.status(400).json({ message: `Cannot pay for booking with status ${booking.status}` });
    }

    const session = await createCheckoutSession(booking);
    return successResponse(res, { checkoutUrl: session.url }, "Checkout session created");
});

/**
 * Confirm checkout session synchronously from payment success page
 */
exports.confirmSession = catchAsync(async (req, res) => {
    const { sessionId, bookingId } = req.body;

    if (!sessionId || !bookingId) {
        return errorResponse(res, 'sessionId and bookingId are required', 400);
    }

    if (!stripe) {
        return errorResponse(res, 'Stripe is not configured on this server', 400);
    }

    // Retrieve the session from Stripe to verify
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
        return errorResponse(res, 'Session not found', 404);
    }

    // Ensure session is paid and corresponds to the bookingId
    if (session.payment_status === 'paid' && session.metadata.bookingId === bookingId) {
        await handleSuccessfulPayment(session);
        return successResponse(res, null, 'Payment confirmed successfully');
    } else {
        return errorResponse(res, 'Payment not confirmed or session mismatch', 400);
    }
});
