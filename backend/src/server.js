require('dotenv').config();

const app = require("./app");
const prisma = require("./utils/prisma");
const { PORT } = require("./config/env");

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Connect and start synchronously to keep process alive
prisma.$connect()
    .then(() => {
        console.log("Database connected successfully.");
        const port = PORT || 5000;
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

        // Ensure server doesn't close silently
        server.on('error', (err) => {
            console.error('Server Error:', err);
            process.exit(1);
        });
    })
    .catch((error) => {
        console.error("Unable to start server:", error);
        process.exit(1);
    });


