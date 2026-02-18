const prisma = require('./src/utils/prisma');

async function checkSchema() {
    try {
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type, numeric_precision, numeric_scale
            FROM information_schema.columns
            WHERE table_name = 'Service' AND column_name = 'price';
        `;
        console.log("Database Schema for Service.price:");
        console.table(result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
