require('dotenv').config();

const app = require("./app");
const prisma = require("./utils/prisma");
const { PORT } = require("./config/env");

async function main() {
    try {
        // Connect to DB
        await prisma.$connect();
        console.log("Database connected successfully.");

        // Start Server
        const port = PORT || 5000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error);
        process.exit(1);
    }
}

main();
