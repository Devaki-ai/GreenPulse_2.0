const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getMyCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  updateGrowthStage,
  updateSoilInfo,
  uploadCropImage,
  getHealthSummary,
} = require('../controllers/cropController');

const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `crop-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All routes require authentication
router.use(protect);

router.get('/health-summary', getHealthSummary);
router.get('/', getMyCrops);
router.get('/:id', getCropById);
router.post('/', createCrop);
router.put('/:id', updateCrop);
router.delete('/:id', deleteCrop);
router.patch('/:id/growth-stage', updateGrowthStage);
router.patch('/:id/soil', updateSoilInfo);
router.post('/:id/images', upload.single('image'), uploadCropImage);

module.exports = router;
