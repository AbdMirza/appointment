const { z } = require("zod");

const validationFailed = (res, result) =>
    res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
    });

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["BUSINESS_ADMIN", "STAFF", "CUSTOMER"], {
        errorMap: () => ({ message: "Invalid role selection" }),
    }),
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessContact: z.string().optional(),
    businessTimezone: z.string().optional(),
}).refine((data) => {
    if (data.role === "BUSINESS_ADMIN") {
        if (!data.businessName || data.businessName.length < 2) return false;
        if (!data.businessAddress || data.businessAddress.length < 5) return false;
        if (!data.businessContact || data.businessContact.length < 5) return false;
        if (!data.businessTimezone) return false;
    }
    return true;
}, {
    message: "All business fields are required for Business Admin",
    path: ["businessName"],
});

const serviceSchema = z.object({
    name: z.string().min(2, "Service name must be at least 2 characters"),
    duration: z.coerce.number().int().positive("Duration must be a positive integer"),
    price: z.union([z.coerce.number(), z.string()]).optional(),
    description: z.string().optional(),
    bufferTimeBefore: z.coerce.number().int().nonnegative().optional(),
    bufferTimeAfter: z.coerce.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
});

const serviceUpdateSchema = serviceSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required to update" }
);

const bookingSchema = z.object({
    serviceId: z.string().uuid("Invalid service ID"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start time format",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end time format",
    }).optional(),
    notes: z.string().max(500).optional(),
    phone: z.string().max(20).optional(),
    staffId: z.string().uuid().optional(),
    paymentMode: z.enum(["PAY_NOW", "PAY_LATER"]).optional(),
});

const bookingStatusSchema = z.object({
    status: z.enum([
        "PENDING", "ASSIGNED", "CONFIRMED", "CANCELLED", "LATE_CANCELLED",
        "REJECTED", "COMPLETED", "NO_SHOW", "AWAITING_PAYMENT"
    ]),
    staffId: z.string().uuid().optional(),
});

const bookingCancelSchema = z.object({
    isAdminOverride: z.boolean().optional(),
});

const businessProfileSchema = z.object({
    name: z.string().min(2, "Business name must be at least 2 characters").optional(),
    address: z.string().min(5, "Address must be at least 5 characters").optional(),
    contact: z.string().min(5, "Contact must be at least 5 characters").optional(),
    timezone: z.string().min(1).optional(),
});

const businessHoursEntrySchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    isOpen: z.boolean(),
});

const businessHoursSchema = z.object({
    hours: z.array(businessHoursEntrySchema).min(1).max(7),
});

const bookingConfigSchema = z.object({
    slotInterval: z.number().int().positive().optional(),
    minBookingNotice: z.number().int().nonnegative().optional(),
    maxBookingWindow: z.number().int().positive().optional(),
    cancellationDeadline: z.number().int().positive().optional(),
    rescheduleDeadline: z.number().int().positive().optional(),
    lateCancelPolicy: z.enum(["BLOCK", "ALLOW_LATE_MARK"]).optional(),
    refundPercentage: z.number().int().min(0).max(100).optional(),
});

const staffCreateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format").transform(val => val.toLowerCase()),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const staffUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().transform(val => val?.toLowerCase()),
    password: z.string().min(6).optional(),
    phone: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
});

const customerProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().max(20).optional(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const staffScheduleSchema = z.object({
    schedule: z.array(z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        breakStart: z.string().optional().nullable(),
        breakEnd: z.string().optional().nullable(),
    })),
});

const timeOffSchema = z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    reason: z.string().max(500).optional(),
});

const timeOffStatusSchema = z.object({
    status: z.enum(["APPROVED", "DECLINED"]),
});

const assignServicesSchema = z.object({
    serviceIds: z.array(z.string().uuid()),
});

const publicSlotsQuerySchema = z.object({
    businessId: z.string().uuid(),
    serviceId: z.string().uuid(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    staffId: z.string().uuid().optional(),
});

const makeValidator = (schema, source = "body") => (req, res, next) => {
    const data = source === "query" ? req.query : req.body;
    const result = schema.safeParse(data);
    if (!result.success) return validationFailed(res, result);
    if (source === "query") req.query = result.data;
    else req.body = result.data;
    next();
};

module.exports = {
    validateRegister: makeValidator(registerSchema),
    validateService: makeValidator(serviceSchema),
    validateServiceUpdate: makeValidator(serviceUpdateSchema),
    validateBooking: makeValidator(bookingSchema),
    validateBookingStatus: makeValidator(bookingStatusSchema),
    validateBookingCancel: makeValidator(bookingCancelSchema),
    validateBusinessProfile: makeValidator(businessProfileSchema),
    validateBusinessHours: makeValidator(businessHoursSchema),
    validateBookingConfig: makeValidator(bookingConfigSchema),
    validateStaffCreate: makeValidator(staffCreateSchema),
    validateStaffUpdate: makeValidator(staffUpdateSchema),
    validateCustomerProfile: makeValidator(customerProfileSchema),
    validateChangePassword: makeValidator(changePasswordSchema),
    validateStaffSchedule: makeValidator(staffScheduleSchema),
    validateTimeOff: makeValidator(timeOffSchema),
    validateTimeOffStatus: makeValidator(timeOffStatusSchema),
    validateAssignServices: makeValidator(assignServicesSchema),
    validatePublicSlotsQuery: makeValidator(publicSlotsQuerySchema, "query"),
};
