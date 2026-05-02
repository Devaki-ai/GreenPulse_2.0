const mongoose = require('mongoose');

const weatherLogSchema = new mongoose.Schema(
  {
    location: {
      city: { type: String, required: true },
      state: { type: String, default: '' },
      country: { type: String, default: 'IN' },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    current: {
      temperature: { type: Number }, // Celsius
      feelsLike: { type: Number },
      humidity: { type: Number },    // percentage
      pressure: { type: Number },    // hPa
      windSpeed: { type: Number },   // m/s
      windDirection: { type: Number }, // degrees
      visibility: { type: Number },  // meters
      uvIndex: { type: Number },
      cloudCover: { type: Number },  // percentage
      description: { type: String },
      icon: { type: String },
      condition: {
        type: String,
        enum: ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy', 'windy', 'hazy'],
        default: 'clear',
      },
    },
    forecast: [
      {
        date: { type: Date },
        tempMin: { type: Number },
        tempMax: { type: Number },
        humidity: { type: Number },
        precipitation: { type: Number }, // mm
        precipitationProbability: { type: Number }, // percentage
        windSpeed: { type: Number },
        description: { type: String },
        icon: { type: String },
        condition: { type: String },
        farmingAdvice: { type: String }, // AI-generated farming tip for the day
      },
    ],
    farmingRecommendations: {
      irrigation: { type: String, default: '' },
      pestControl: { type: String, default: '' },
      harvesting: { type: String, default: '' },
      planting: { type: String, default: '' },
      general: { type: String, default: '' },
    },
    alerts: [
      {
        type: { type: String }, // frost, flood, drought, storm
        severity: { type: String, enum: ['low', 'medium', 'high', 'extreme'] },
        message: { type: String },
        validFrom: { type: Date },
        validTo: { type: Date },
      },
    ],
    // Cache expiry - weather data is valid for 30 minutes
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000),
      index: { expires: 0 }, // TTL index - auto delete expired docs
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
weatherLogSchema.index({ 'location.city': 1 });
weatherLogSchema.index({ 'location.lat': 1, 'location.lng': 1 });
weatherLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

module.exports = mongoose.model('WeatherLog', weatherLogSchema);
