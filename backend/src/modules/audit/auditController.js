const prisma = require('../../utils/prisma');
const { catchAsync } = require('../../utils/controllerHelpers');
const { successResponse } = require('../../utils/responseHelpers');

exports.getAuditLogs = catchAsync(async (req, res) => {
    const { businessId } = req.user;
    const { action, entityType, limit = 100, offset = 0 } = req.query;

    const where = { businessId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(parseInt(limit, 10) || 100, 200),
            skip: parseInt(offset, 10) || 0
        }),
        prisma.auditLog.count({ where })
    ]);

    return successResponse(res, { logs, total });
});
