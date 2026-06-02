const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.warn("⚠️  STRIPE_SECRET_KEY is not defined in .env. Payments will not work.");
}

const stripe = stripeKey ? new Stripe(stripeKey) : null;

if (stripe) {
    console.log("✅ Stripe: Ready for payments.");
}


/**
 * Create a Stripe Checkout Session for a booking
 * @param {Object} booking - The booking object with service and user details
 * @returns {Promise<Object>} - Stripe session object
 */
const createCheckoutSession = async (booking) => {
    if (!stripe) {
        throw new Error("Stripe is not configured. Please check your STRIPE_SECRET_KEY in .env");
    }
    const session = await stripe.checkout.sessions.create({

        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: booking.service.name,
                        description: `Appointment for ${booking.service.name}`,
                    },
                    unit_amount: Math.round(Number(booking.service.price) * 100), // Stripe expects amount in cents
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/my-bookings`,
        metadata: {
            bookingId: booking.id,
            userId: booking.userId,
        },
    });

    return session;
};

/**
 * Issue a refund for a payment
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {number} amount - Amount to refund (optional, in cents)
 * @returns {Promise<Object>} - Stripe refund object
 */
const issueRefund = async (paymentIntentId, amount = null) => {
    if (!stripe) {
        throw new Error("Stripe is not configured. Please check your STRIPE_SECRET_KEY in .env");
    }
    const refundOptions = {

        payment_intent: paymentIntentId,
    };
    if (amount) {
        refundOptions.amount = Math.round(amount * 100);
    }
    
    return await stripe.refunds.create(refundOptions);
};

module.exports = {
    stripe,
    createCheckoutSession,
    issueRefund,
};
