const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  addReview,
  getMyListings,
  getMarketTrends,
} = require('../controllers/marketplaceController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public routes (optional auth to track views)
router.get('/trends', protect, getMarketTrends);
router.get('/', optionalAuth, getAllProducts);
router.get('/:id', optionalAuth, getProductById);

// Protected routes
router.get('/user/my-listings', protect, getMyListings);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/images', protect, upload.array('images', 5), uploadProductImages);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
