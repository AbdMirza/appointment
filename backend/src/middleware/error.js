const errorHandler = (err, req, res, next) => {
    console.error('[Error] ', err.stack);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Prisma unique constraint failed (P2002)
    if (err.code === 'P2002') {
        statusCode = 400;
        const target = err.meta?.target || [];
        if (target.includes('email')) {
            message = 'Email already exists';
        } else {
            message = `A record with this ${target.join(', ')} already exists.`;
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = { errorHandler };
