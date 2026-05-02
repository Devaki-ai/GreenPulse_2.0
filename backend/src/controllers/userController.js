const User = require('../models/User');
const Crop = require('../models/Crop');
const DiseaseDetection = require('../models/DiseaseDetection');
const SoilRecord = require('../models/SoilRecord');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const cloudinary = require('../config/cloudinary');

// ─── @desc    Get all users (admin only)
// ─── @route   GET /api/users
// ─── @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return paginatedResponse(res, users, page, limit, total);
});

// ─── @desc    Get user by ID
// ─── @route   GET /api/users/:id
// ─── @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, 404, 'User not found');
  return successResponse(res, 200, 'User fetched', user);
});

// ─── @desc    Get farmer dashboard stats
// ─── @route   GET /api/users/dashboard
// ─── @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const farmerId = req.user._id;

  const [
    totalCrops,
    activeCrops,
    healthyCrops,
    totalScans,
    recentScans,
    soilRecords,
  ] = await Promise.all([
    Crop.countDocuments({ farmer: farmerId }),
    Crop.countDocuments({ farmer: farmerId, isActive: true }),
    Crop.countDocuments({ farmer: farmerId, healthStatus: { $in: ['excellent', 'good'] } }),
    DiseaseDetection.countDocuments({ farmer: farmerId }),
    DiseaseDetection.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('crop', 'name'),
    SoilRecord.find({ farmer: farmerId })
      .sort({ testDate: -1 })
      .limit(3),
  ]);

  // Crop health distribution
  const healthDistribution = await Crop.aggregate([
    { $match: { farmer: farmerId, isActive: true } },
    { $group: { _id: '$healthStatus', count: { $sum: 1 } } },
  ]);

  // Recent crops
  const recentCrops = await Crop.find({ farmer: farmerId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name healthStatus healthScore currentGrowthStage sowingDate expectedHarvestDate');

  const stats = {
    overview: {
      totalCrops,
      activeCrops,
      healthyCrops,
      healthPercentage: activeCrops > 0 ? Math.round((healthyCrops / activeCrops) * 100) : 0,
      totalScans,
    },
    healthDistribution: healthDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentCrops,
    recentScans,
    latestSoilRecord: soilRecords[0] || null,
  };

  return successResponse(res, 200, 'Dashboard stats fetched', stats);
});

// ─── @desc    Upload avatar
// ─── @route   POST /api/users/avatar
// ─── @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 400, 'Please upload an image file');
  }

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'greenpulse/avatars',
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'face',
  });

  // Update user avatar
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true }
  );

  return successResponse(res, 200, 'Avatar uploaded successfully', {
    avatar: user.avatar,
  });
});

// ─── @desc    Toggle user active status (admin)
// ─── @route   PATCH /api/users/:id/toggle-status
// ─── @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, 404, 'User not found');

  // Prevent deactivating own account
  if (user._id.toString() === req.user._id.toString()) {
    return errorResponse(res, 400, 'You cannot deactivate your own account');
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return successResponse(
    res,
    200,
    `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    { isActive: user.isActive }
  );
});

// ─── @desc    Delete user (admin)
// ─── @route   DELETE /api/users/:id
// ─── @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, 404, 'User not found');

  if (user._id.toString() === req.user._id.toString()) {
    return errorResponse(res, 400, 'You cannot delete your own account');
  }

  await User.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'User deleted successfully');
});

module.exports = {
  getAllUsers,
  getUserById,
  getDashboardStats,
  uploadAvatar,
  toggleUserStatus,
  deleteUser,
};
