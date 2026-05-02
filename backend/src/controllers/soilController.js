const SoilRecord = require('../models/SoilRecord');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// ─── Helper: Determine status from value ──────────────────────────────────────
const getNutrientStatus = (nutrient, value) => {
  const thresholds = {
    nitrogen:   { low: 280, high: 560 },
    phosphorus: { low: 10,  high: 25  },
    potassium:  { low: 110, high: 280 },
  };
  const t = thresholds[nutrient];
  if (!t) return 'medium';
  if (value < t.low) return 'low';
  if (value > t.high) return 'high';
  return 'medium';
};

const getPhStatus = (ph) => {
  if (ph < 4.5) return 'very_acidic';
  if (ph < 6.0) return 'acidic';
  if (ph <= 7.5) return 'neutral';
  if (ph <= 8.5) return 'alkaline';
  return 'very_alkaline';
};

const getMoistureStatus = (moisture) => {
  if (moisture < 20) return 'dry';
  if (moisture > 70) return 'wet';
  return 'optimal';
};

const getOrganicStatus = (value) => {
  if (value < 1) return 'low';
  if (value > 3) return 'high';
  return 'medium';
};

// ─── @desc    Get all soil records for farmer
// ─── @route   GET /api/soil
// ─── @access  Private
const getMySoilRecords = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { farmer: req.user._id };
  if (req.query.cropId) filter.crop = req.query.cropId;

  const [records, total] = await Promise.all([
    SoilRecord.find(filter)
      .populate('crop', 'name variety')
      .skip(skip)
      .limit(limit)
      .sort({ testDate: -1 }),
    SoilRecord.countDocuments(filter),
  ]);

  return paginatedResponse(res, records, page, limit, total);
});

// ─── @desc    Get single soil record
// ─── @route   GET /api/soil/:id
// ─── @access  Private
const getSoilRecordById = asyncHandler(async (req, res) => {
  const record = await SoilRecord.findOne({
    _id: req.params.id,
    farmer: req.user._id,
  }).populate('crop', 'name variety');

  if (!record) return errorResponse(res, 404, 'Soil record not found');
  return successResponse(res, 200, 'Soil record fetched', record);
});

// ─── @desc    Create soil record
// ─── @route   POST /api/soil
// ─── @access  Private
const createSoilRecord = asyncHandler(async (req, res) => {
  const {
    fieldName, crop, soilType, nutrients, ph,
    moisture, organicMatter, testMethod, notes, location,
  } = req.body;

  // Auto-calculate statuses
  const recordData = {
    farmer: req.user._id,
    fieldName,
    crop: crop || null,
    soilType: soilType || 'unknown',
    testMethod: testMethod || 'manual',
    notes: notes || '',
    location: location || {},
    nutrients: {
      nitrogen: {
        value: nutrients?.nitrogen || 0,
        status: getNutrientStatus('nitrogen', nutrients?.nitrogen || 0),
      },
      phosphorus: {
        value: nutrients?.phosphorus || 0,
        status: getNutrientStatus('phosphorus', nutrients?.phosphorus || 0),
      },
      potassium: {
        value: nutrients?.potassium || 0,
        status: getNutrientStatus('potassium', nutrients?.potassium || 0),
      },
    },
    ph: {
      value: ph || 7,
      status: getPhStatus(ph || 7),
    },
    moisture: {
      value: moisture || 0,
      status: getMoistureStatus(moisture || 0),
    },
    organicMatter: {
      value: organicMatter || 0,
      status: getOrganicStatus(organicMatter || 0),
    },
  };

  const record = await SoilRecord.create(recordData);
  return successResponse(res, 201, 'Soil record created successfully', record);
});

// ─── @desc    Update soil record
// ─── @route   PUT /api/soil/:id
// ─── @access  Private
const updateSoilRecord = asyncHandler(async (req, res) => {
  const record = await SoilRecord.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!record) return errorResponse(res, 404, 'Soil record not found');

  // Recalculate statuses if values changed
  if (req.body.nutrients) {
    const n = req.body.nutrients;
    req.body.nutrients = {
      nitrogen: { value: n.nitrogen, status: getNutrientStatus('nitrogen', n.nitrogen) },
      phosphorus: { value: n.phosphorus, status: getNutrientStatus('phosphorus', n.phosphorus) },
      potassium: { value: n.potassium, status: getNutrientStatus('potassium', n.potassium) },
    };
  }
  if (req.body.ph !== undefined) {
    req.body.ph = { value: req.body.ph, status: getPhStatus(req.body.ph) };
  }
  if (req.body.moisture !== undefined) {
    req.body.moisture = { value: req.body.moisture, status: getMoistureStatus(req.body.moisture) };
  }
  if (req.body.organicMatter !== undefined) {
    req.body.organicMatter = { value: req.body.organicMatter, status: getOrganicStatus(req.body.organicMatter) };
  }

  const updated = await SoilRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, 'Soil record updated', updated);
});

// ─── @desc    Delete soil record
// ─── @route   DELETE /api/soil/:id
// ─── @access  Private
const deleteSoilRecord = asyncHandler(async (req, res) => {
  const record = await SoilRecord.findOne({ _id: req.params.id, farmer: req.user._id });
  if (!record) return errorResponse(res, 404, 'Soil record not found');

  await SoilRecord.findByIdAndDelete(req.params.id);
  return successResponse(res, 200, 'Soil record deleted');
});

// ─── @desc    Get soil trend for a field (last N records)
// ─── @route   GET /api/soil/trend?fieldName=Main Field
// ─── @access  Private
const getSoilTrend = asyncHandler(async (req, res) => {
  const { fieldName, limit = 10 } = req.query;

  const filter = { farmer: req.user._id };
  if (fieldName) filter.fieldName = { $regex: fieldName, $options: 'i' };

  const records = await SoilRecord.find(filter)
    .sort({ testDate: -1 })
    .limit(parseInt(limit))
    .select('testDate ph moisture nutrients organicMatter fieldName');

  return successResponse(res, 200, 'Soil trend fetched', records.reverse());
});

module.exports = {
  getMySoilRecords,
  getSoilRecordById,
  createSoilRecord,
  updateSoilRecord,
  deleteSoilRecord,
  getSoilTrend,
};
