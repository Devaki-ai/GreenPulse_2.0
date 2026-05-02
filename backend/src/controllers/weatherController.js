const axios = require('axios');
const WeatherLog = require('../models/WeatherLog');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Helper: Map weather condition to our enum ─────────────────────────────────
const mapCondition = (weatherId) => {
  if (weatherId >= 200 && weatherId < 300) return 'stormy';
  if (weatherId >= 300 && weatherId < 600) return 'rainy';
  if (weatherId >= 600 && weatherId < 700) return 'snowy';
  if (weatherId >= 700 && weatherId < 800) return 'foggy';
  if (weatherId === 800) return 'clear';
  if (weatherId > 800) return 'cloudy';
  return 'clear';
};

// ─── Helper: Generate farming recommendations based on weather ─────────────────
const generateFarmingRecommendations = (current, forecast) => {
  const temp = current.temperature;
  const humidity = current.humidity;
  const condition = current.condition;
  const windSpeed = current.windSpeed;

  const recommendations = {
    irrigation: '',
    pestControl: '',
    harvesting: '',
    planting: '',
    general: '',
  };

  // Irrigation advice
  if (condition === 'rainy') {
    recommendations.irrigation = '🌧️ Rain expected — skip irrigation today to avoid waterlogging.';
  } else if (humidity < 40) {
    recommendations.irrigation = '💧 Low humidity detected — increase irrigation frequency.';
  } else if (temp > 35) {
    recommendations.irrigation = '🌡️ High temperature — irrigate early morning or evening to reduce evaporation.';
  } else {
    recommendations.irrigation = '✅ Normal conditions — maintain regular irrigation schedule.';
  }

  // Pest control advice
  if (humidity > 80 && temp > 25) {
    recommendations.pestControl = '⚠️ High humidity + warm temperature — ideal conditions for fungal diseases. Inspect crops and consider preventive fungicide.';
  } else if (condition === 'rainy') {
    recommendations.pestControl = '🌧️ Avoid spraying pesticides during rain — wait for dry weather for effective application.';
  } else if (windSpeed > 5) {
    recommendations.pestControl = '💨 High winds — avoid pesticide spraying to prevent drift.';
  } else {
    recommendations.pestControl = '✅ Good conditions for pest control if needed.';
  }

  // Harvesting advice
  if (condition === 'clear' && humidity < 70) {
    recommendations.harvesting = '☀️ Excellent conditions for harvesting today.';
  } else if (condition === 'rainy' || condition === 'stormy') {
    recommendations.harvesting = '🌧️ Avoid harvesting in wet conditions — risk of crop damage and mold.';
  } else {
    recommendations.harvesting = '⛅ Moderate conditions — harvesting possible but monitor weather closely.';
  }

  // Planting advice
  if (temp >= 20 && temp <= 30 && humidity >= 50 && condition !== 'stormy') {
    recommendations.planting = '🌱 Ideal conditions for planting or transplanting seedlings.';
  } else if (temp < 15) {
    recommendations.planting = '🥶 Too cold for most crops — wait for warmer temperatures.';
  } else if (temp > 38) {
    recommendations.planting = '🌡️ Too hot — avoid planting. Wait for cooler weather.';
  } else {
    recommendations.planting = '⚠️ Suboptimal conditions — check specific crop requirements before planting.';
  }

  // General advice
  const rainDays = forecast?.filter((d) => d.condition === 'rainy' || d.condition === 'stormy').length || 0;
  if (rainDays >= 3) {
    recommendations.general = `🌧️ ${rainDays} rainy days expected this week — prepare drainage and protect stored crops.`;
  } else if (temp > 40) {
    recommendations.general = '🔥 Extreme heat alert — provide shade for sensitive crops and increase watering.';
  } else {
    recommendations.general = '🌿 Weather looks favorable for farming activities this week.';
  }

  return recommendations;
};

// ─── @desc    Get current weather + 7-day forecast by city
// ─── @route   GET /api/weather?city=Mumbai
// ─── @access  Private
const getWeatherByCity = asyncHandler(async (req, res) => {
  const { city } = req.query;
  if (!city) return errorResponse(res, 400, 'Please provide a city name');

  // Check cache first
  const cached = await WeatherLog.findOne({
    'location.city': { $regex: new RegExp(`^${city}$`, 'i') },
    expiresAt: { $gt: new Date() },
  });

  if (cached) {
    logger.info(`Weather cache hit for: ${city}`);
    return successResponse(res, 200, 'Weather data fetched (cached)', cached);
  }

  const apiKey = process.env.WEATHER_API_KEY;
  const baseUrl = process.env.WEATHER_BASE_URL;

  if (!apiKey || apiKey === 'your-openweathermap-api-key-here') {
    // Return mock data if no API key configured
    return successResponse(res, 200, 'Weather data (demo mode — add WEATHER_API_KEY to .env)', getMockWeather(city));
  }

  // Fetch current weather
  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`${baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`),
    axios.get(`${baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&cnt=56`),
  ]);

  const curr = currentRes.data;
  const forecastData = forecastRes.data;

  // Build current weather object
  const current = {
    temperature: Math.round(curr.main.temp),
    feelsLike: Math.round(curr.main.feels_like),
    humidity: curr.main.humidity,
    pressure: curr.main.pressure,
    windSpeed: curr.wind.speed,
    windDirection: curr.wind.deg,
    visibility: curr.visibility,
    cloudCover: curr.clouds.all,
    description: curr.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${curr.weather[0].icon}@2x.png`,
    condition: mapCondition(curr.weather[0].id),
  };

  // Build 7-day forecast (one entry per day)
  const dailyMap = {};
  forecastData.list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date: new Date(date),
        temps: [],
        humidity: item.main.humidity,
        precipitation: item.rain?.['3h'] || 0,
        precipitationProbability: Math.round((item.pop || 0) * 100),
        windSpeed: item.wind.speed,
        description: item.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
        condition: mapCondition(item.weather[0].id),
      };
    }
    dailyMap[date].temps.push(item.main.temp);
  });

  const forecast = Object.values(dailyMap).slice(0, 7).map((day) => ({
    ...day,
    tempMin: Math.round(Math.min(...day.temps)),
    tempMax: Math.round(Math.max(...day.temps)),
    farmingAdvice: '',
  }));

  const farmingRecommendations = generateFarmingRecommendations(current, forecast);

  // Save to cache
  const weatherLog = await WeatherLog.create({
    location: {
      city: curr.name,
      country: curr.sys.country,
      lat: curr.coord.lat,
      lng: curr.coord.lon,
    },
    current,
    forecast,
    farmingRecommendations,
  });

  return successResponse(res, 200, 'Weather data fetched', weatherLog);
});

// ─── @desc    Get weather by coordinates
// ─── @route   GET /api/weather/coords?lat=19.07&lng=72.87
// ─── @access  Private
const getWeatherByCoords = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return errorResponse(res, 400, 'Please provide lat and lng coordinates');

  const apiKey = process.env.WEATHER_API_KEY;
  const baseUrl = process.env.WEATHER_BASE_URL;

  if (!apiKey || apiKey === 'your-openweathermap-api-key-here') {
    return successResponse(res, 200, 'Weather data (demo mode)', getMockWeather('Your Location'));
  }

  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`${baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`),
    axios.get(`${baseUrl}/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=56`),
  ]);

  const curr = currentRes.data;
  const current = {
    temperature: Math.round(curr.main.temp),
    feelsLike: Math.round(curr.main.feels_like),
    humidity: curr.main.humidity,
    pressure: curr.main.pressure,
    windSpeed: curr.wind.speed,
    windDirection: curr.wind.deg,
    visibility: curr.visibility,
    cloudCover: curr.clouds.all,
    description: curr.weather[0].description,
    icon: `https://openweathermap.org/img/wn/${curr.weather[0].icon}@2x.png`,
    condition: mapCondition(curr.weather[0].id),
  };

  const farmingRecommendations = generateFarmingRecommendations(current, []);

  return successResponse(res, 200, 'Weather data fetched', {
    location: { city: curr.name, lat: parseFloat(lat), lng: parseFloat(lng) },
    current,
    farmingRecommendations,
  });
});

// ─── Mock weather data for demo/dev without API key ───────────────────────────
const getMockWeather = (city) => ({
  location: { city, country: 'IN', lat: 20.5937, lng: 78.9629 },
  current: {
    temperature: 28,
    feelsLike: 31,
    humidity: 65,
    pressure: 1013,
    windSpeed: 3.5,
    windDirection: 180,
    visibility: 10000,
    cloudCover: 40,
    description: 'partly cloudy',
    icon: 'https://openweathermap.org/img/wn/02d@2x.png',
    condition: 'cloudy',
  },
  forecast: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000),
    tempMin: 22 + Math.floor(Math.random() * 3),
    tempMax: 30 + Math.floor(Math.random() * 5),
    humidity: 60 + Math.floor(Math.random() * 20),
    precipitation: i % 3 === 0 ? 5 : 0,
    precipitationProbability: i % 3 === 0 ? 60 : 10,
    windSpeed: 2 + Math.random() * 4,
    description: i % 3 === 0 ? 'light rain' : 'partly cloudy',
    icon: `https://openweathermap.org/img/wn/${i % 3 === 0 ? '10d' : '02d'}@2x.png`,
    condition: i % 3 === 0 ? 'rainy' : 'cloudy',
    farmingAdvice: i % 3 === 0 ? 'Skip irrigation — rain expected' : 'Good day for field work',
  })),
  farmingRecommendations: {
    irrigation: '✅ Normal conditions — maintain regular irrigation schedule.',
    pestControl: '✅ Good conditions for pest control if needed.',
    harvesting: '☀️ Moderate conditions for harvesting.',
    planting: '🌱 Suitable conditions for planting.',
    general: '🌿 Weather looks favorable for farming activities this week.',
  },
});

module.exports = { getWeatherByCity, getWeatherByCoords };
