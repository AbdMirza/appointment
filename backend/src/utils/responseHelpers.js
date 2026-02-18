
const successResponse = (res, data, message = null, statusCode = 200) => {
  
    return res.status(statusCode).json(data);
};


const errorResponse = (res, message = "Internal Server Error", statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};


const notFoundResponse = (res, resource = "Resource") => {
    return errorResponse(res, `${resource} not found`, 404);
};

const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
    });
};


const forbiddenResponse = (res, message = "Forbidden") => {
    return errorResponse(res, message, 403);
};

module.exports = {
    successResponse,
    errorResponse,
    notFoundResponse,
    validationErrorResponse,
    forbiddenResponse,
};
