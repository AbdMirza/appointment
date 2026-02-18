const prisma = require('./src/utils/prisma');
async function listPrices() {
    try {
        const services = await prisma.service.findMany({
            select: { name: true, price: true }
        });
        services.forEach(s => {
            console.log(`${s.name}: ${s.price.toString()}`);
        });
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
listPrices();
