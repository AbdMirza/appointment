const prisma = require('./src/utils/prisma');
const { Prisma } = require('@prisma/client');

async function testPrice() {
    try {
        console.log("Testing price precision...");

        // Find an existing business to link the service to
        const business = await prisma.business.findFirst();
        if (!business) {
            console.error("No business found in DB. Please create one first.");
            process.exit(1);
        }

        const testPriceValue = "25.00";
        console.log(`Input value: ${testPriceValue}`);

        const service = await prisma.service.create({
            data: {
                name: "Test Precision Service",
                duration: 30,
                price: new Prisma.Decimal(testPriceValue),
                businessId: business.id
            }
        });

        console.log(`Saved price (Decimal object):`, service.price);
        console.log(`Saved price (toString):`, service.price.toString());
        console.log(`Saved price (Number):`, service.price.toNumber());

        // Cleanup
        await prisma.service.delete({ where: { id: service.id } });

        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

testPrice();
