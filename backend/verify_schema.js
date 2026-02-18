const prisma = require('./src/utils/prisma');

async function test() {
    try {
        const fields = Object.keys(prisma.timeOff.fields || {});
        console.log("TimeOff fields:", fields);
        // Better way to check: try to find one record and check keys
        const one = await prisma.timeOff.findFirst();
        if (one) {
            console.log("Found record status:", one.status);
        } else {
            console.log("No records found, but Prisma client loaded.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Schema verify failed:", e.message);
        process.exit(1);
    }
}
test();
