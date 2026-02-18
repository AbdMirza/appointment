
const prisma = require('./src/utils/prisma');
const appointmentController = require('./src/modules/appointments/appointmentController');

// Mock Express Request/Response
const mockRes = {
    status: (code) => {
        console.log(`[Response Status]: ${code}`);
        return mockRes;
    },
    json: (data) => {
        console.log('[Response Data]:');
        console.dir(data, { depth: null, colors: true });
        return mockRes;
    }
};

const mockNext = (err) => {
    console.error('[Next Error]:', err);
};

const runTest = async () => {
    try {
        console.log('1. Connecting to DB...');

        // Find a business admin
        const admin = await prisma.user.findFirst({
            where: { role: 'BUSINESS_ADMIN' },
            select: { id: true, businessId: true, role: true, name: true }
        });

        if (!admin) {
            console.error('No Business Admin found to test with.');
            process.exit(1);
        }

        console.log(`2. Found Admin: ${admin.name} (${admin.id}) Business: ${admin.businessId}`);

        // Mock Request
        const req = {
            user: admin,
            query: {
                tab: 'upcoming'
            }
        };

        console.log('3. Calling getBusinessBookings...');
        await appointmentController.getBusinessBookings(req, mockRes, mockNext);

        console.log('4. Done.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
};

runTest();
