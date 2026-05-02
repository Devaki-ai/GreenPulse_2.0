const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['cereal', 'vegetable', 'fruit', 'pulse', 'oilseed', 'spice', 'fiber', 'other'],
      default: 'other',
    },
    season: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid', 'year-round'],
      default: 'kharif',
    },
    fieldArea: {
      type: Number, // in acres
      default: 0,
    },
    sowingDate: {
      type: Date,
      default: null,
    },
    expectedHarvestDate: {
      type: Date,
      default: null,
    },
    currentGrowthStage: {
      type: String,
      enum: ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvest'],
      default: 'seed',
    },
    healthStatus: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
      default: 'good',
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    soilInfo: {
      ph: { type: Number, min: 0, max: 14, default: 7 },
      nitrogen: { type: Number, default: 0 },   // kg/ha
      phosphorus: { type: Number, default: 0 }, // kg/ha
      potassium: { type: Number, default: 0 },  // kg/ha
      moisture: { type: Number, default: 0 },   // percentage
      organicMatter: { type: Number, default: 0 }, // percentage
    },
    waterRequirement: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    fertilizersUsed: [
      {
        name: String,
        quantity: Number,
        unit: String,
        appliedDate: Date,
      },
    ],
    pesticidesUsed: [
      {
        name: String,
        quantity: Number,
        unit: String,
        appliedDate: Date,
        reason: String,
      },
    ],
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      fieldName: { type: String, default: '' },
    },
    aiInsights: {
      lastAnalyzed: { type: Date, default: null },
      recommendations: [{ type: String }],
      riskFactors: [{ type: String }],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Days since sowing ────────────────────────────────────────────────
cropSchema.virtual('daysSinceSowing').get(function () {
  if (!this.sowingDate) return null;
  const diff = Date.now() - new Date(this.sowingDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ─── Virtual: Days to harvest ──────────────────────────────────────────────────
cropSchema.virtual('daysToHarvest').get(function () {
  if (!this.expectedHarvestDate) return null;
  const diff = new Date(this.expectedHarvestDate).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
cropSchema.index({ farmer: 1 });
cropSchema.index({ name: 1 });
cropSchema.index({ healthStatus: 1 });
cropSchema.index({ season: 1 });

module.exports = mongoose.model('Crop', cropSchema);
