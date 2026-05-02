const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getAllUsers,
  getUserById,
  getDashboardStats,
  uploadAvatar,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

// ─── Multer config for avatar uploads ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

// ─── Routes ────────────────────────────────────────────────────────────────────

// Farmer routes
router.get('/dashboard', protect, getDashboardStats);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
