const prisma = require('./prisma');

/**
 * Wrapper to catch async errors and pass to Express error handler
 * Alternative to express-async-handler
 * @param {Function} fn - Async function to wrap
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Validate that required fields are present in request body
 * @param {Array} fields - Array of required field names
 * @param {Object} body - Request body object
 * @returns {Object} { isValid: boolean, missing: Array }
 */
const validateRequired = (fields, body) => {
    const missing = fields.filter(field => !body[field]);

    return {
        isValid: missing.length === 0,
        missing,
        error: missing.length > 0 ? `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required` : null
    };
};

/**
 * Check if a resource belongs to a specific business
 * @param {String} resourceId - Resource ID to check
 * @param {String} businessId - Business ID to verify ownership
 * @param {String} resourceType - Type of resource ('service', 'user', etc.)
 * @returns {Promise<Boolean>} True if belongs to business, false otherwise
 */
const checkBusinessOwnership = async (resourceId, businessId, resourceType = 'service') => {
    try {
        let resource;

        switch (resourceType) {
            case 'service':
                resource = await prisma.service.findFirst({
                    where: { id: resourceId, businessId }
                });
                break;
            case 'user':
                resource = await prisma.user.findFirst({
                    where: { id: resourceId, businessId }
                });
                break;
            default:
                return false;
        }

        return !!resource;
    } catch (error) {
        console.error(`Error checking ${resourceType} ownership:`, error);
        return false;
    }
};

/**
 * Sanitize user data for public display (remove sensitive fields)
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
    if (!user) return null;

    const { password, ...sanitized } = user;
    return sanitized;
};

module.exports = {
    catchAsync,
    validateRequired,
    checkBusinessOwnership,
    sanitizeUser
};
