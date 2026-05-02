const User = require('../models/User');
const Crop = require('../models/Crop');
const Product = require('../models/Product');
const DiseaseDetection = require('../models/DiseaseDetection');
const SoilRecord = require('../models/SoilRecord');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── @desc    Get platform-wide analytics
// ─── @route   GET /api/admin/analytics
// ─── @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFarmers,
    totalBuyers,
    totalCrops,
    totalProducts,
    totalScans,
    newUsersThisMonth,
    activeProducts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'buyer' }),
    Crop.countDocuments(),
    Product.countDocuments(),
    DiseaseDetection.countDocuments(),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }, // since 1st of month
    }),
    Product.countDocuments({ status: 'active' }),
  ]);

  // User growth (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Disease detection stats
  const diseaseStats = await DiseaseDetection.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$result.diseaseName',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$result.confidenceScore' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Crop distribution by category
  const cropDistribution = await Crop.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Product distribution by category
  const productDistribution = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price.amount' } } },
    { $sort: { count: -1 } },
  ]);

  // Top states by farmer count
  const topStates = await User.aggregate([
    { $match: { role: 'farmer', 'location.state': { $ne: '' } } },
    { $group: { _id: '$location.state', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return successResponse(res, 200, 'Analytics fetched', {
    overview: {
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalCrops,
      totalProducts,
      activeProducts,
      totalScans,
      newUsersThisMonth,
    },
    userGrowth,
    diseaseStats,
    cropDistribution,
    productDistribution,
    topStates,
  });
});

// ─── @desc    Get pending product reviews
// ─── @route   GET /api/admin/products/pending
// ─── @access  Private/Admin
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'pending_review' })
    .populate('seller', 'name email phone')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Pending products fetched', products);
});

// ─── @desc    Approve or reject product
// ─── @route   PATCH /api/admin/products/:id/moderate
// ─── @access  Private/Admin
const moderateProduct = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return errorResponse(res, 400, 'Action must be "approve" or "reject"');
  }

  const product = await Product.findById(req.params.id);
  if (!product) return errorResponse(res, 404, 'Product not found');

  product.status = action === 'approve' ? 'active' : 'inactive';
  await product.save();

  return successResponse(res, 200, `Product ${action}d successfully`, {
    productId: product._id,
    status: product.status,
    reason: reason || '',
  });
});

// ─── @desc    Get recent activity feed
// ─── @route   GET /api/admin/activity
// ─── @access  Private/Admin
const getActivityFeed = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const [recentUsers, recentProducts, recentScans] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    Product.find().sort({ createdAt: -1 }).limit(5)
      .select('title category status createdAt')
      .populate('seller', 'name'),
    DiseaseDetection.find().sort({ createdAt: -1 }).limit(5)
      .select('cropName result.diseaseName result.confidenceScore createdAt')
      .populate('farmer', 'name'),
  ]);

  const feed = [
    ...recentUsers.map((u) => ({ type: 'new_user', data: u, time: u.createdAt })),
    ...recentProducts.map((p) => ({ type: 'new_product', data: p, time: p.createdAt })),
    ...recentScans.map((s) => ({ type: 'disease_scan', data: s, time: s.createdAt })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);

  return successResponse(res, 200, 'Activity feed fetched', feed);
});

module.exports = { getAnalytics, getPendingProducts, moderateProduct, getActivityFeed };
