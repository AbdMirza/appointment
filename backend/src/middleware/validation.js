const { z } = require("zod");

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["BUSINESS_ADMIN", "STAFF", "CUSTOMER"], {
        errorMap: () => ({ message: "Invalid role selection" }),
    }),
    // Business fields - required for BUSINESS_ADMIN
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

const validateRegister = (req, res, next) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.flatten().fieldErrors,
        });
    }
    next();
};

module.exports = {
    validateRegister,
};
