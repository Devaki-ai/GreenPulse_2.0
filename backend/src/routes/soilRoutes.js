const express = require('express');
const router = express.Router();

const {
  getMySoilRecords,
  getSoilRecordById,
  createSoilRecord,
  updateSoilRecord,
  deleteSoilRecord,
  getSoilTrend,
} = require('../controllers/soilController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/trend', getSoilTrend);
router.get('/', getMySoilRecords);
router.get('/:id', getSoilRecordById);
router.post('/', createSoilRecord);
router.put('/:id', updateSoilRecord);
router.delete('/:id', deleteSoilRecord);

module.exports = router;
