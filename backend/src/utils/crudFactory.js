const prisma = require('./prisma');
const { catchAsync, validateRequired } = require('./controllerHelpers');
const { successResponse, notFoundResponse, errorResponse, validationErrorResponse } = require('./responseHelpers');

/**
 * Generic CRUD Factory to generate standard controller methods
 * @param {String} modelName - Prisma model name (e.g., 'service', 'user')
 * @param {Object} options - Customization options
 */
const crudFactory = (modelName, options = {}) => {
    const {
        include: defaultInclude = undefined,
        select: defaultSelect = undefined,
        searchFields = [],
        softDeleteField = 'deletedAt',
        businessIdField = 'businessId',
        defaultOrderBy = { createdAt: 'desc' },
        validateFields = [],
        useSoftDelete = true,
        useBusinessFilter = true
    } = options;

    return {
        getAll: catchAsync(async (req, res) => {
            const businessId = req.user?.businessId;
            const { search, status, ...queryFilters } = req.query;

            // Start with a clean where clause
            const where = {};

            // 1. Force filters from options (if any)
            if (options.where) {
                Object.assign(where, options.where);
            }

            // 2. Merge query param filters EARLY (e.g. role=STAFF) so they are
            //    available for business-filter decisions below
            const prismaKeys = ['take', 'skip', 'orderBy', 'include', 'select', 'cursor'];
            Object.keys(queryFilters).forEach(key => {
                if (!prismaKeys.includes(key) && !key.startsWith('_')) {
                    where[key] = queryFilters[key];
                }
            });

            // 3. Apply Soft Delete
            const softDeleteModels = ['user', 'service', 'business'];
            if (useSoftDelete && softDeleteModels.includes(modelName.toLowerCase())) {
                where[softDeleteField] = null;
            }

            // 4. Apply Business Filter (now where.role is already set from query params)
            if (useBusinessFilter && businessId) {
                const businessModels = ['service', 'user', 'notification'];
                if (businessModels.includes(modelName.toLowerCase())) {
                    // For 'User' model, skip businessId filter for Customers
                    // because Customers don't have businessId on their User record.
                    if (modelName.toLowerCase() === 'user' && where.role === 'CUSTOMER') {
                        // Skip businessId filter for pure customer queries
                    } else {
                        where[businessIdField] = businessId;
                    }
                }
            }

            // 5. Apply Status/Active filters
            if (status === 'active') {
                where.isActive = true;
            } else if (status === 'inactive') {
                where.isActive = false;
            } else if (status) {
                // Allow generic status filters (e.g. for Booking status)
                where.status = status;
            }

            // 6. Apply Search
            if (search && searchFields.length > 0) {
                where.OR = searchFields.map(field => ({
                    [field]: { contains: search, mode: 'insensitive' }
                }));
            }

            // 7. RE-APPLY forced filters from options to ensure they aren't overwritten by req.query
            if (options.where) {
                Object.assign(where, options.where);
            }

            // 8. Build query
            const queryOptions = {
                where,
                orderBy: req.query.orderBy || defaultOrderBy,
                take: req.query.take ? parseInt(req.query.take) : undefined,
                skip: req.query.skip ? parseInt(req.query.skip) : undefined,
            };

            const select = req.query.select || options.select || defaultSelect;
            const include = req.query.include || options.include || defaultInclude;

            if (select) {
                queryOptions.select = select;
            } else if (include) {
                queryOptions.include = include;
            }

            try {
                const records = await prisma[modelName].findMany(queryOptions);
                return successResponse(res, records);
            } catch (err) {
                console.error(`CRUD Factory getAll Error for ${modelName}:`, err);
                throw err;
            }
        }),

        getOne: catchAsync(async (req, res) => {
            const { id } = req.params;
            const businessId = req.user?.businessId;

            const where = { id };
            if (options.where) Object.assign(where, options.where);

            const softDeleteModels = ['user', 'service'];
            if (useSoftDelete && softDeleteModels.includes(modelName.toLowerCase())) {
                where[softDeleteField] = null;
            }

            if (useBusinessFilter && businessId) {
                const businessModels = ['service', 'user', 'notification'];
                if (businessModels.includes(modelName.toLowerCase())) {
                    if (!(modelName.toLowerCase() === 'user' && where.role === 'CUSTOMER')) {
                        where[businessIdField] = businessId;
                    }
                }
            }

            const record = await prisma[modelName].findFirst({
                where,
                include: options.include || defaultInclude,
                select: options.select || defaultSelect
            });

            if (!record) {
                return notFoundResponse(res, modelName.charAt(0).toUpperCase() + modelName.slice(1));
            }

            return successResponse(res, record);
        }),

        create: catchAsync(async (req, res) => {
            const businessId = req.user?.businessId;

            if (validateFields.length > 0) {
                const validation = validateRequired(validateFields, req.body);
                if (!validation.isValid) {
                    return validationErrorResponse(res, validation.error);
                }
            }

            const data = { ...req.body };

            if (useBusinessFilter && businessId) {
                const businessModels = ['service', 'user', 'notification'];
                if (businessModels.includes(modelName.toLowerCase())) {
                    if (!(modelName.toLowerCase() === 'user' && data.role === 'CUSTOMER')) {
                        data[businessIdField] = businessId;
                    }
                }
            }

            const record = await prisma[modelName].create({
                data,
                include: options.include || defaultInclude,
                select: options.select || defaultSelect
            });

            return successResponse(res, record, `${modelName} created successfully`, 201);
        }),

        update: catchAsync(async (req, res) => {
            const { id } = req.params;
            const record = await prisma[modelName].update({
                where: { id },
                data: req.body,
                include: options.include || defaultInclude,
                select: options.select || defaultSelect
            });

            return successResponse(res, record, `${modelName} updated successfully`);
        }),

        delete: catchAsync(async (req, res) => {
            const { id } = req.params;

            if (options.beforeDelete) {
                const canDelete = await options.beforeDelete(id);
                if (canDelete !== true) {
                    return errorResponse(res, canDelete, 400);
                }
            }

            const softDeleteModels = ['user', 'service', 'business'];
            if (useSoftDelete && softDeleteModels.includes(modelName.toLowerCase())) {
                await prisma[modelName].update({
                    where: { id },
                    data: { [softDeleteField]: new Date(), isActive: false }
                });
            } else {
                await prisma[modelName].delete({ where: { id } });
            }

            return successResponse(res, {}, `${modelName} deleted successfully`);
        })
    };
};

module.exports = crudFactory;
