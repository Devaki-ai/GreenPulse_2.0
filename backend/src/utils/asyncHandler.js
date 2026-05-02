/**
 * Async handler to avoid try/catch in every controller
 * Compatible with both Express 4 and Express 5
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((err) => {
    if (typeof next === 'function') {
      next(err);
    } else {
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

module.exports = asyncHandler;
