const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for a user
 * @param {string} userId - MongoDB user _id
 * @returns {string} signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate token and send as response with cookie
 * @param {object} user - Mongoose user document
 * @param {number} statusCode - HTTP status code
 * @param {object} res - Express response object
 * @param {string} message - Response message
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  // Remove password from output
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('greenpulse_token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      data: { user: userObj },
    });
};

module.exports = { generateToken, sendTokenResponse };
