const mongoose = require('mongoose');

const soilRecordSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      default: null,
    },
    fieldName: {
      type: String,
      default: 'Main Field',
      trim: true,
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: '' },
    },
    soilType: {
      type: String,
      enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'unknown'],
      default: 'unknown',
    },
    // NPK values
    nutrients: {
      nitrogen: {
        value: { type: Number, default: 0 }, // kg/ha
        status: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
      phosphorus: {
        value: { type: Number, default: 0 },
        status: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
      potassium: {
        value: { type: Number, default: 0 },
        status: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
    },
    ph: {
      value: { type: Number, min: 0, max: 14, default: 7 },
      status: {
        type: String,
        enum: ['very_acidic', 'acidic', 'neutral', 'alkaline', 'very_alkaline'],
        default: 'neutral',
      },
    },
    moisture: {
      value: { type: Number, min: 0, max: 100, default: 0 }, // percentage
      status: { type: String, enum: ['dry', 'optimal', 'wet'], default: 'optimal' },
    },
    organicMatter: {
      value: { type: Number, default: 0 }, // percentage
      status: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    },
    temperature: {
      value: { type: Number, default: null }, // Celsius
    },
    electricalConductivity: {
      value: { type: Number, default: null }, // dS/m
    },
    testMethod: {
      type: String,
      enum: ['lab', 'sensor', 'manual', 'ai_estimated'],
      default: 'manual',
    },
    testDate: {
      type: Date,
      default: Date.now,
    },
    aiRecommendations: {
      fertilizers: [{ type: String }],
      amendments: [{ type: String }],
      suitableCrops: [{ type: String }],
      generalAdvice: { type: String, default: '' },
      analyzedAt: { type: Date, default: null },
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Overall soil health score (0-100) ────────────────────────────────
soilRecordSchema.virtual('healthScore').get(function () {
  let score = 50; // base

  // pH contribution (ideal 6-7.5)
  const ph = this.ph.value;
  if (ph >= 6 && ph <= 7.5) score += 15;
  else if (ph >= 5.5 && ph <= 8) score += 8;

  // Moisture contribution
  if (this.moisture.status === 'optimal') score += 15;
  else if (this.moisture.status !== 'optimal') score += 5;

  // Organic matter
  if (this.organicMatter.status === 'high') score += 10;
  else if (this.organicMatter.status === 'medium') score += 5;

  // NPK
  const npkStatuses = [
    this.nutrients.nitrogen.status,
    this.nutrients.phosphorus.status,
    this.nutrients.potassium.status,
  ];
  const mediumOrHigh = npkStatuses.filter((s) => s !== 'low').length;
  score += mediumOrHigh * 3;

  return Math.min(100, score);
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
soilRecordSchema.index({ farmer: 1 });
soilRecordSchema.index({ crop: 1 });
soilRecordSchema.index({ testDate: -1 });

module.exports = mongoose.model('SoilRecord', soilRecordSchema);
