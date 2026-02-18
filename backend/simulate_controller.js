const { Prisma } = require('@prisma/client');

function simulateBackend(priceStr) {
    console.log(`Input string: "${priceStr}"`);
    let price = new Prisma.Decimal(priceStr).toDecimalPlaces(2);
    console.log(`Decimal value:`, price.toString());

    // Simulate JSON serialization (res.json)
    let json = JSON.stringify({ price });
    console.log(`Serialized JSON:`, json);

    // Simulate JSON parsing (frontend response.json())
    let parsed = JSON.parse(json);
    console.log(`Parsed price:`, parsed.price, `(${typeof parsed.price})`);
}

simulateBackend("25");
simulateBackend("25.00");
simulateBackend("35");
