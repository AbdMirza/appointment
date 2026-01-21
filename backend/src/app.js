const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/error");
const router = require("./router");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Appointment Booking API",
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

// Mount V1 API
app.use("/api", router);

// access prisma example in routes if needed via req or import
// app.use((req, res, next) => { req.prisma = prisma; next(); });

// Global Error Handler
app.use(errorHandler);

module.exports = app;
