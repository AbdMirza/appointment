const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/error");
const router = require("./router");
require("./utils/notificationQueue"); // Initialize BullMQ worker

const app = express();

// Middleware
app.use(cors());

// Special handling for Stripe Webhook (needs raw body)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
    const paymentController = require('./modules/payments/paymentController');
    paymentController.handleWebhook(req, res, next);
});

app.use(express.json());
app.use("/invoices", express.static("public/invoices"));



// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to SCHOOL",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ Status: "HEllo", timestamp: new Date() });
});

// Mount all API
app.use("/api", router);



// Global Error Handler
app.use(errorHandler);

module.exports = app;
