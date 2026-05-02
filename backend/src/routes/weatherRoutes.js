const express = require('express');
const router = express.Router();

const { getWeatherByCity, getWeatherByCoords } = require('../controllers/weatherController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getWeatherByCity);           // GET /api/weather?city=Mumbai
router.get('/coords', getWeatherByCoords);   // GET /api/weather/coords?lat=19.07&lng=72.87

module.exports = router;
