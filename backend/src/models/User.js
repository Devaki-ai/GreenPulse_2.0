const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'admin'],
      default: 'farmer',
    },
    avatar:   { type: String, default: '' },
    phone:    { type: String, trim: true, default: '' },
    location: {
      village:  { type: String, default: '' },
      district: { type: String, default: '' },
      state:    { type: String, default: '' },
      country:  { type: String, default: 'India' },
      pincode:  { type: String, default: '' },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    farmDetails: {
      farmSize: { type: Number, default: 0 },
      soilType: {
        type: String,
        enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'unknown'],
        default: 'unknown',
      },
      irrigationType: {
        type: String,
        enum: ['drip', 'sprinkler', 'flood', 'rainfed', 'none'],
        default: 'none',
      },
      primaryCrops: [{ type: String }],
    },
    preferences: {
      language:      { type: String, default: 'en' },
      notifications: { type: Boolean, default: true },
      darkMode:      { type: Boolean, default: false },
    },
    isVerified:         { type: Boolean, default: false },
    isActive:           { type: Boolean, default: true },
    lastLogin:          { type: Date, default: null },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire:{ type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Full location string ────────────────────────────────────────────
userSchema.virtual('fullLocation').get(function () {
  const { village, district, state, country } = this.location;
  return [village, district, state, country].filter(Boolean).join(', ');
});

// ─── Pre-save: Hash password (no next parameter — compatible with Express 5) ──
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Method: Compare password ──────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ 'location.state': 1 });

module.exports = mongoose.model('User', userSchema);
