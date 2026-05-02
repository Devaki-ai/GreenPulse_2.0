const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── @desc    Register a new user
// ─── @route   POST /api/auth/register
// ─── @access  Public
const register = asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { name, email, password, role, phone, location, farmDetails } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return errorResponse(res, 400, 'An account with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'farmer',
    phone: phone || '',
    location: location || {},
    farmDetails: farmDetails || {},
  });

  logger.success(`New user registered: ${user.email} (${user.role})`);

  sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to GreenPulse 🌱');
});

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user with password field included
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return errorResponse(res, 401, 'Invalid email or password');
  }

  if (!user.isActive) {
    return errorResponse(res, 401, 'Your account has been deactivated. Please contact support.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 401, 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email}`);

  sendTokenResponse(user, 200, res, `Welcome back, ${user.name}! 🌱`);
});

// ─── @desc    Get current logged-in user
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return successResponse(res, 200, 'User profile fetched', user);
});

// ─── @desc    Logout user (clear cookie)
// ─── @route   POST /api/auth/logout
// ─── @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('greenpulse_token', '', {
    expires: new Date(0),
    httpOnly: true,
  });

  return successResponse(res, 200, 'Logged out successfully');
});

// ─── @desc    Update profile
// ─── @route   PUT /api/auth/update-profile
// ─── @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validation failed', errors.array());
  }

  // Fields allowed to update
  const allowedFields = ['name', 'phone', 'location', 'farmDetails', 'preferences', 'avatar'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, 'Profile updated successfully', user);
});

// ─── @desc    Change password
// ─── @route   PUT /api/auth/change-password
// ─── @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return errorResponse(res, 401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

// ─── @desc    Forgot password - generate reset token
// ─── @route   POST /api/auth/forgot-password
// ─── @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return errorResponse(res, 400, 'Please provide your email address');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) {
    return successResponse(res, 200, 'If an account with that email exists, a reset link has been sent.');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });

  // In production, send email here using nodemailer
  // For now, return token in dev mode
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  logger.info(`Password reset requested for: ${user.email}`);

  if (process.env.NODE_ENV === 'development') {
    return successResponse(res, 200, 'Reset token generated (dev mode)', { resetUrl, resetToken });
  }

  return successResponse(res, 200, 'If an account with that email exists, a reset link has been sent.');
});

// ─── @desc    Reset password using token
// ─── @route   PUT /api/auth/reset-password/:token
// ─── @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return errorResponse(res, 400, 'Password must be at least 6 characters');
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    return errorResponse(res, 400, 'Invalid or expired reset token. Please request a new one.');
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.success(`Password reset successful for: ${user.email}`);

  sendTokenResponse(user, 200, res, 'Password reset successful! You are now logged in.');
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
