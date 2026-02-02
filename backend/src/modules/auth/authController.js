const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { JWT_SECRET } = require("../../config/env");
const prisma = require("../../utils/prisma");
const asyncHandler = require("express-async-handler");

// Token expiry constants
const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Refresh token valid for 7 days

// Helper: Generate refresh token and store in DB
const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  return token;
};

//  Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      businessId: user.businessId
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// LOGIN CONTROLLER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business?.name
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// REGISTER CONTROLLER
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, businessName, businessAddress, businessContact, businessTimezone } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    let businessId = null;

    if (role === "BUSINESS_ADMIN") {
      const newBusiness = await tx.business.create({
        data: {
          name: businessName,
          address: businessAddress,
          contact: businessContact,
          timezone: businessTimezone || "UTC"
        }
      });
      businessId = newBusiness.id;
    }

    const newUser = await tx.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role,
        businessId: businessId
      },
      include: { business: true }
    });

    return { user: newUser };
  });

  const newUser = result.user;

  const accessToken = generateAccessToken(newUser);
  const refreshToken = await generateRefreshToken(newUser.id);

  res.status(201).json({
    message: role === "BUSINESS_ADMIN" ? "Business and Admin created successfully" : "User registered successfully",
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      businessId: newUser.businessId,
      businessName: newUser.business?.name
    }
  });
});

// REFRESH TOKEN CONTROLLER
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  // Find token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { include: { business: true } } }
  });

  if (!storedToken) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  // Check if expired
  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    return res.status(401).json({ message: "Refresh token expired" });
  }

  const user = storedToken.user;
  const accessToken = generateAccessToken(user);

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: user.business?.name
    }
  });
});

// LOGOUT CONTROLLER
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  // Delete the refresh token from database
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken }
  });

  res.json({ message: "Logged out successfully" });
});
