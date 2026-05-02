const express = require('express');
const router = express.Router();

const {
  getAnalytics,
  getPendingProducts,
  moderateProduct,
  getActivityFeed,
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/activity', getActivityFeed);
router.get('/products/pending', getPendingProducts);
router.patch('/products/:id/moderate', moderateProduct);

module.exports = router;
