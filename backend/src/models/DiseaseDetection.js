const mongoose = require('mongoose');

const diseaseDetectionSchema = new mongoose.Schema(
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
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    image: {
      url: { type: String, required: [true, 'Image URL is required'] },
      publicId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    result: {
      isHealthy: { type: Boolean, default: null },
      diseaseName: { type: String, default: '' },
      diseaseType: {
        type: String,
        enum: ['fungal', 'bacterial', 'viral', 'pest', 'nutrient_deficiency', 'environmental', 'none', 'unknown'],
        default: 'unknown',
      },
      confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      }, // percentage
      severity: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe', 'critical'],
        default: 'none',
      },
      affectedArea: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      }, // estimated % of plant affected
      symptoms: [{ type: String }],
      causes: [{ type: String }],
    },
    treatments: {
      immediate: [{ type: String }],    // urgent actions
      chemical: [                        // chemical treatments
        {
          name: String,
          dosage: String,
          frequency: String,
          precautions: String,
        },
      ],
      organic: [{ type: String }],       // organic/natural remedies
      preventive: [{ type: String }],    // future prevention tips
    },
    aiProvider: {
      type: String,
      enum: ['openai', 'gemini', 'mock'],
      default: 'openai',
    },
    processingTime: {
      type: Number, // milliseconds
      default: 0,
    },
    userFeedback: {
      isAccurate: { type: Boolean, default: null },
      comment: { type: String, default: '' },
      ratedAt: { type: Date, default: null },
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Confidence label ─────────────────────────────────────────────────
diseaseDetectionSchema.virtual('confidenceLabel').get(function () {
  const score = this.result.confidenceScore;
  if (score >= 90) return 'Very High';
  if (score >= 75) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very Low';
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
diseaseDetectionSchema.index({ farmer: 1 });
diseaseDetectionSchema.index({ crop: 1 });
diseaseDetectionSchema.index({ status: 1 });
diseaseDetectionSchema.index({ 'result.diseaseName': 1 });
diseaseDetectionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DiseaseDetection', diseaseDetectionSchema);
