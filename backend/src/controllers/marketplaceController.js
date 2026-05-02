const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const cloudinary = require('../config/cloudinary');

// ─── @desc    Get all products (public with filters)
// ─── @route   GET /api/marketplace
// ─── @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = { status: 'active' };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.state) filter['location.state'] = { $regex: req.query.state, $options: 'i' };
  if (req.query.organic === 'true') filter.organicCertified = true;
  if (req.query.minPrice || req.query.maxPrice) {
    filter['price.amount'] = {};
    if (req.query.minPrice) filter['price.amount'].$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter['price.amount'].$lte = parseFloat(req.query.maxPrice);
  }

  // Full-text search
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Sort options
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { 'price.amount': 1 },
    price_desc: { 'price.amount': -1 },
    popular: { views: -1 },
    rating: { 'ratings.average': -1 },
  };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name avatar location.state location.district')
      .skip(skip)
      .limit(limit)
      .sort(sort),
    Product.countDocuments(filter),
  ]);

  return paginatedResponse(res, products, page, limit, total);
});

// ─── @desc    Get single product
// ─── @route   GET /api/marketplace/:id
// ─── @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name avatar phone location farmDetails')
    .populate('reviews.user', 'name avatar');

  if (!product) return errorResponse(res, 404, 'Product not found');

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  return successResponse(res, 200, 'Product fetched', product);
});

// ─── @desc    Create product listing
// ─── @route   POST /api/marketplace
// ─── @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const productData = {
    ...req.body,
    seller: req.user._id,
    location: req.body.location || req.user.location,
  };

  const product = await Product.create(productData);
  return successResponse(res, 201, 'Product listed successfully 🛒', product);
});

// ─── @desc    Update product
// ─── @route   PUT /api/marketplace/:id
// ─── @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
  if (!product) return errorResponse(res, 404, 'Product not found or not authorized');

  delete req.body.seller;
  delete req.body.reviews;
  delete req.body.ratings;

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, 'Product updated successfully', updated);
});

// ─── @desc    Delete product
// ─── @route   DELETE /api/marketplace/:id
// ─── @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    $or: [{ seller: req.user._id }, { _id: req.params.id }],
  });

  if (!product) return errorResponse(res, 404, 'Product not found');

  // Only seller or admin can delete
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 403, 'Not authorized to delete this product');
  }

  // Delete images from Cloudinary
  for (const img of product.images) {
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }

  await Product.findByIdAndDelete(req.params.id);
  return successResponse(res, 200, 'Product deleted successfully');
});

// ─── @desc    Upload product images
// ─── @route   POST /api/marketplace/:id/images
// ─── @access  Private
const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
  if (!product) return errorResponse(res, 404, 'Product not found');

  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 400, 'Please upload at least one image');
  }

  const uploadPromises = req.files.map((file) =>
    cloudinary.uploader.upload(file.path, {
      folder: 'greenpulse/marketplace',
      width: 800,
      crop: 'limit',
    })
  );

  const results = await Promise.all(uploadPromises);

  const newImages = results.map((r, i) => ({
    url: r.secure_url,
    publicId: r.public_id,
    isPrimary: product.images.length === 0 && i === 0,
  }));

  product.images.push(...newImages);
  await product.save();

  return successResponse(res, 200, 'Images uploaded successfully', product.images);
});

// ─── @desc    Add review to product
// ─── @route   POST /api/marketplace/:id/reviews
// ─── @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse(res, 400, 'Rating must be between 1 and 5');
  }

  const product = await Product.findById(req.params.id);
  if (!product) return errorResponse(res, 404, 'Product not found');

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return errorResponse(res, 400, 'You have already reviewed this product');
  }

  product.reviews.push({ user: req.user._id, rating, comment: comment || '' });
  await product.save(); // pre-save hook recalculates average

  return successResponse(res, 201, 'Review added successfully', {
    rating: product.ratings,
    reviewCount: product.reviews.length,
  });
});

// ─── @desc    Get my listings
// ─── @route   GET /api/marketplace/my-listings
// ─── @access  Private
const getMyListings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { seller: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(filter),
  ]);

  return paginatedResponse(res, products, page, limit, total);
});

// ─── @desc    Get market price trends by category
// ─── @route   GET /api/marketplace/trends
// ─── @access  Private
const getMarketTrends = asyncHandler(async (req, res) => {
  const trends = await Product.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        avgPrice: { $avg: '$price.amount' },
        minPrice: { $min: '$price.amount' },
        maxPrice: { $max: '$price.amount' },
        totalListings: { $sum: 1 },
      },
    },
    { $sort: { totalListings: -1 } },
  ]);

  return successResponse(res, 200, 'Market trends fetched', trends);
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  addReview,
  getMyListings,
  getMarketTrends,
};
