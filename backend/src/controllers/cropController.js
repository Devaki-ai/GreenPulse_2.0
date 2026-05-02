const Crop = require('../models/Crop');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const cloudinary = require('../config/cloudinary');

// ─── @desc    Get all crops for logged-in farmer
// ─── @route   GET /api/crops
// ─── @access  Private
const getMyCrops = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { farmer: req.user._id };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.season) filter.season = req.query.season;
  if (req.query.healthStatus) filter.healthStatus = req.query.healthStatus;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [crops, total] = await Promise.all([
    Crop.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Crop.countDocuments(filter),
  ]);

  return paginatedResponse(res, crops, page, limit, total);
});

// ─── @desc    Get single crop
// ─── @route   GET /api/crops/:id
// ─── @access  Private
const getCropById = asyncHandler(async (req, res) => {
  const crop = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!crop) return errorResponse(res, 404, 'Crop not found');
  return successResponse(res, 200, 'Crop fetched', crop);
});

// ─── @desc    Create new crop
// ─── @route   POST /api/crops
// ─── @access  Private
const createCrop = asyncHandler(async (req, res) => {
  const cropData = { ...req.body, farmer: req.user._id };
  const crop = await Crop.create(cropData);
  return successResponse(res, 201, 'Crop added successfully 🌾', crop);
});

// ─── @desc    Update crop
// ─── @route   PUT /api/crops/:id
// ─── @access  Private
const updateCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!crop) return errorResponse(res, 404, 'Crop not found');

  // Prevent changing farmer field
  delete req.body.farmer;

  const updated = await Crop.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, 'Crop updated successfully', updated);
});

// ─── @desc    Delete crop
// ─── @route   DELETE /api/crops/:id
// ─── @access  Private
const deleteCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!crop) return errorResponse(res, 404, 'Crop not found');

  // Delete images from Cloudinary
  for (const img of crop.images) {
    if (img.publicId) {
      await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }
  }

  await Crop.findByIdAndDelete(req.params.id);
  return successResponse(res, 200, 'Crop deleted successfully');
});

// ─── @desc    Update crop growth stage
// ─── @route   PATCH /api/crops/:id/growth-stage
// ─── @access  Private
const updateGrowthStage = asyncHandler(async (req, res) => {
  const { stage } = req.body;
  const validStages = ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvest'];

  if (!stage || !validStages.includes(stage)) {
    return errorResponse(res, 400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }

  const crop = await Crop.findOneAndUpdate(
    { _id: req.params.id, farmer: req.user._id },
    { currentGrowthStage: stage },
    { new: true }
  );

  if (!crop) return errorResponse(res, 404, 'Crop not found');
  return successResponse(res, 200, `Growth stage updated to "${stage}"`, crop);
});

// ─── @desc    Update soil info for a crop
// ─── @route   PATCH /api/crops/:id/soil
// ─── @access  Private
const updateSoilInfo = asyncHandler(async (req, res) => {
  const crop = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!crop) return errorResponse(res, 404, 'Crop not found');

  crop.soilInfo = { ...crop.soilInfo.toObject(), ...req.body };
  await crop.save();

  return successResponse(res, 200, 'Soil info updated', crop);
});

// ─── @desc    Upload crop image
// ─── @route   POST /api/crops/:id/images
// ─── @access  Private
const uploadCropImage = asyncHandler(async (req, res) => {
  const crop = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!crop) return errorResponse(res, 404, 'Crop not found');

  if (!req.file) return errorResponse(res, 400, 'Please upload an image');

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'greenpulse/crops',
    width: 800,
    crop: 'limit',
  });

  crop.images.push({
    url: result.secure_url,
    publicId: result.public_id,
    caption: req.body.caption || '',
  });

  await crop.save();
  return successResponse(res, 200, 'Image uploaded successfully', crop);
});

// ─── @desc    Get crop health summary for all farmer crops
// ─── @route   GET /api/crops/health-summary
// ─── @access  Private
const getHealthSummary = asyncHandler(async (req, res) => {
  const summary = await Crop.aggregate([
    { $match: { farmer: req.user._id, isActive: true } },
    {
      $group: {
        _id: '$healthStatus',
        count: { $sum: 1 },
        avgScore: { $avg: '$healthScore' },
      },
    },
  ]);

  const totalActive = await Crop.countDocuments({ farmer: req.user._id, isActive: true });
  const avgHealthScore = await Crop.aggregate([
    { $match: { farmer: req.user._id, isActive: true } },
    { $group: { _id: null, avg: { $avg: '$healthScore' } } },
  ]);

  return successResponse(res, 200, 'Health summary fetched', {
    totalActive,
    averageHealthScore: avgHealthScore[0]?.avg?.toFixed(1) || 0,
    distribution: summary,
  });
});

module.exports = {
  getMyCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  updateGrowthStage,
  updateSoilInfo,
  uploadCropImage,
  getHealthSummary,
};
