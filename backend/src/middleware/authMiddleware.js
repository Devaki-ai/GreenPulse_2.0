const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - verify JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Also check cookie
  else if (req.cookies && req.cookies.greenpulse_token) {
    token = req.cookies.greenpulse_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please log in.',
    });
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Get user from DB (exclude password)
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User belonging to this token no longer exists.',
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Contact support.',
    });
  }

  req.user = user;
  next();
});

/**
 * Restrict to specific roles
 * Usage: authorize('admin'), authorize('admin', 'farmer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

/**
 * Optional auth - attaches user if token present, but doesn't block if not
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.greenpulse_token) {
    token = req.cookies.greenpulse_token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      req.user = null;
    }
  }

  next();
});

module.exports = { protect, authorize, optionalAuth };
