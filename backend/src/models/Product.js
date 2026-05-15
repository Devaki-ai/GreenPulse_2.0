const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['crop', 'fertilizer', 'pesticide', 'equipment', 'seed', 'tool', 'other'],
    },
    subCategory: {
      type: String,
      default: '',
    },
    price: {
      amount: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
      },
      currency: { type: String, default: 'INR' },
      unit: { type: String, default: 'kg' }, // per kg, per piece, per litre, etc.
      negotiable: { type: Boolean, default: false },
    },
    quantity: {
      available: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
      },
      unit: { type: String, default: 'kg' },
      minimum: { type: Number, default: 1 }, // minimum order quantity
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    location: {
      village: { type: String, default: '' },
      district: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'inactive', 'pending_review'],
      default: 'active',
    },
    condition: {
      type: String,
      enum: ['new', 'used', 'refurbished'],
      default: 'new',
    },
    tags: [{ type: String, lowercase: true }],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null }, // for perishable crops
    harvestDate: { type: Date, default: null },
    organicCertified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Is expired ───────────────────────────────────────────────────────
productSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
});

// ─── Pre-save: Calculate average rating ───────────────────────────────────────
productSchema.pre('save', function () {
  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.ratings.average = parseFloat((total / this.reviews.length).toFixed(1));
    this.ratings.count = this.reviews.length;
  }
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'location.state': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' }); // full-text search

module.exports = mongoose.model('Product', productSchema);
