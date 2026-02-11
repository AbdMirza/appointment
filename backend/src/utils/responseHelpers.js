/**
 * Standardized response helpers to ensure consistent API responses
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {String} message - Optional success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data, message = null, statusCode = 200) => {
    // If data is an array, return it directly (for backward compatibility)
    if (Array.isArray(data)) {
        return res.status(statusCode).json(data);
    }

    const response = {};

    if (message) {
        response.message = message;
    }

    // If data is already an object with a message, merge it
    if (typeof data === 'object' && data !== null) {
        Object.assign(response, data);
    } else {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 */
const errorResponse = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({ message });
};

/**
 * Send a not found response
 * @param {Object} res - Express response object
 * @param {String} resource - Resource name (e.g., "User", "Service")
 */
const notFoundResponse = (res, resource = "Resource") => {
    return res.status(404).json({ message: `${resource} not found` });
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {String|Array} errors - Validation error(s)
 */
const validationErrorResponse = (res, errors) => {
    const message = Array.isArray(errors) ? errors.join(', ') : errors;
    return res.status(400).json({ message });
};

/**
 * Send a forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Optional custom message
 */
const forbiddenResponse = (res, message = "Forbidden: Insufficient permissions") => {
    return res.status(403).json({ message });
};

module.exports = {
    successResponse,
    errorResponse,
    notFoundResponse,
    validationErrorResponse,
    forbiddenResponse
};
