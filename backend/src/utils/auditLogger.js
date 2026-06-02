const prisma = require('./prisma');

/**
 * Logs an administrative action to the AuditLog table.
 * 
 * @param {Object} params
 * @param {string} params.action - e.g., 'SERVICE_UPDATE', 'BOOKING_CANCEL'
 * @param {string} params.entityType - e.g., 'SERVICE', 'BOOKING'
 * @param {string} params.entityId - ID of the entity being acted upon
 * @param {string} params.actorId - ID of the user performing the action
 * @param {string} params.actorRole - Role of the user performing the action
 * @param {string} params.businessId - Business ID associated with the action
 * @param {Object} [params.details] - Optional metadata or old values
 */
const logAudit = async ({
    action,
    entityType,
    entityId,
    actorId,
    actorRole,
    businessId,
    details = {}
}) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                actorId,
                actorRole,
                businessId,
                details
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We don't throw here to avoid breaking the main request if logging fails
    }
};

module.exports = {
    logAudit
};
