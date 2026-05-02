const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  detectDisease,
  getCropRecommendation,
  farmingChat,
  getMyDetections,
  submitFeedback,
} = require('../controllers/aiController');

const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `scan-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for AI analysis
});

router.use(protect);

router.post('/detect-disease', aiLimiter, upload.single('image'), detectDisease);
router.post('/crop-recommendation', aiLimiter, getCropRecommendation);
router.post('/chat', farmingChat);
router.get('/detections', getMyDetections);
router.patch('/detections/:id/feedback', submitFeedback);

module.exports = router;
