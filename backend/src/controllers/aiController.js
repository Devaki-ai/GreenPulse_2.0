const OpenAI = require('openai');
const axios = require('axios');
const DiseaseDetection = require('../models/DiseaseDetection');
const Crop = require('../models/Crop');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

// ─── Initialize OpenAI ────────────────────────────────────────────────────────
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-your-openai-api-key-here') return null;
  return new OpenAI({ apiKey });
};

// ─── @desc    Detect crop disease from image
// ─── @route   POST /api/ai/detect-disease
// ─── @access  Private
const detectDisease = asyncHandler(async (req, res) => {
  const { cropName, cropId } = req.body;

  if (!cropName) return errorResponse(res, 400, 'Please provide the crop name');
  if (!req.file) return errorResponse(res, 400, 'Please upload a crop image');

  const startTime = Date.now();

  // Upload image to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    folder: 'greenpulse/disease-scans',
    width: 1024,
    crop: 'limit',
  });

  // Create detection record
  const detection = await DiseaseDetection.create({
    farmer: req.user._id,
    crop: cropId || null,
    cropName,
    image: { url: uploadResult.secure_url, publicId: uploadResult.public_id },
    status: 'processing',
  });

  const openai = getOpenAIClient();

  let result, treatments;

  if (!openai) {
    // ── Mock response for demo/dev ──────────────────────────────────────────
    logger.warn('OpenAI key not set — returning mock disease detection result');
    result = getMockDiseaseResult(cropName);
    treatments = getMockTreatments(result.diseaseName);
  } else {
    // ── Real OpenAI Vision API call ─────────────────────────────────────────
    const prompt = `You are an expert agricultural plant pathologist AI. Analyze this crop image and provide a detailed disease diagnosis.

Crop: ${cropName}

Respond ONLY with a valid JSON object in this exact format:
{
  "isHealthy": boolean,
  "diseaseName": "string (or 'Healthy' if no disease)",
  "diseaseType": "fungal|bacterial|viral|pest|nutrient_deficiency|environmental|none|unknown",
  "confidenceScore": number (0-100),
  "severity": "none|mild|moderate|severe|critical",
  "affectedArea": number (0-100, estimated % of plant affected),
  "symptoms": ["symptom1", "symptom2"],
  "causes": ["cause1", "cause2"],
  "treatments": {
    "immediate": ["action1", "action2"],
    "chemical": [{"name": "product", "dosage": "amount", "frequency": "schedule", "precautions": "safety info"}],
    "organic": ["remedy1", "remedy2"],
    "preventive": ["tip1", "tip2"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: uploadResult.secure_url, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    result = {
      isHealthy: parsed.isHealthy,
      diseaseName: parsed.diseaseName,
      diseaseType: parsed.diseaseType,
      confidenceScore: parsed.confidenceScore,
      severity: parsed.severity,
      affectedArea: parsed.affectedArea,
      symptoms: parsed.symptoms || [],
      causes: parsed.causes || [],
    };
    treatments = parsed.treatments || {};
  }

  const processingTime = Date.now() - startTime;

  // Update detection record with results
  detection.status = 'completed';
  detection.result = result;
  detection.treatments = treatments;
  detection.aiProvider = openai ? 'openai' : 'mock';
  detection.processingTime = processingTime;
  await detection.save();

  // Update crop health status if cropId provided
  if (cropId && result.severity !== 'none') {
    const healthMap = { mild: 'fair', moderate: 'poor', severe: 'poor', critical: 'critical' };
    await Crop.findByIdAndUpdate(cropId, {
      healthStatus: healthMap[result.severity] || 'fair',
      'aiInsights.lastAnalyzed': new Date(),
      'aiInsights.recommendations': treatments.preventive || [],
    });
  }

  logger.success(`Disease detection completed for ${cropName} in ${processingTime}ms`);

  return successResponse(res, 200, 'Disease detection completed', detection);
});

// ─── @desc    Get crop recommendations based on soil & location
// ─── @route   POST /api/ai/crop-recommendation
// ─── @access  Private
const getCropRecommendation = asyncHandler(async (req, res) => {
  const { soilType, ph, nitrogen, phosphorus, potassium, state, season, rainfall, temperature } = req.body;

  if (!soilType || !season) {
    return errorResponse(res, 400, 'Please provide soilType and season');
  }

  const openai = getOpenAIClient();

  let recommendations;

  if (!openai) {
    recommendations = getMockCropRecommendations(soilType, season);
  } else {
    const prompt = `You are an expert agricultural advisor AI for Indian farmers. Based on the following soil and environmental conditions, recommend the best crops to grow.

Soil Type: ${soilType}
Soil pH: ${ph || 'unknown'}
Nitrogen (N): ${nitrogen || 'unknown'} kg/ha
Phosphorus (P): ${phosphorus || 'unknown'} kg/ha
Potassium (K): ${potassium || 'unknown'} kg/ha
Location/State: ${state || 'India'}
Season: ${season}
Average Rainfall: ${rainfall || 'unknown'} mm
Average Temperature: ${temperature || 'unknown'}°C

Respond ONLY with a valid JSON object:
{
  "topCrops": [
    {
      "name": "crop name",
      "variety": "recommended variety",
      "suitabilityScore": 85,
      "expectedYield": "X tonnes/acre",
      "growingPeriod": "X months",
      "waterRequirement": "low|medium|high",
      "profitability": "low|medium|high",
      "reasons": ["reason1", "reason2"],
      "tips": ["tip1", "tip2"]
    }
  ],
  "soilAmendments": ["amendment1", "amendment2"],
  "generalAdvice": "overall farming advice string",
  "warnings": ["warning1"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    recommendations = JSON.parse(response.choices[0].message.content);
  }

  return successResponse(res, 200, 'Crop recommendations generated', recommendations);
});

// ─── @desc    AI farming chatbot
// ─── @route   POST /api/ai/chat
// ─── @access  Private
const farmingChat = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || message.trim().length === 0) {
    return errorResponse(res, 400, 'Please provide a message');
  }

  const openai = getOpenAIClient();

  if (!openai) {
    return successResponse(res, 200, 'Chat response (demo mode)', {
      reply: getMockChatReply(message),
      isDemo: true,
    });
  }

  const systemPrompt = `You are GreenBot 🌱, an expert AI farming assistant for GreenPulse platform. You help Indian farmers with:
- Crop disease diagnosis and treatment
- Soil health and fertilizer recommendations  
- Weather-based farming advice
- Pest and weed management
- Organic farming practices
- Market price guidance
- Government schemes for farmers

Always respond in a friendly, simple, and practical manner. If the farmer asks in Hindi or regional language, respond in that language. Keep responses concise and actionable.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const reply = response.choices[0].message.content;

  return successResponse(res, 200, 'Chat response', { reply, isDemo: false });
});

// ─── @desc    Get all disease detections for farmer
// ─── @route   GET /api/ai/detections
// ─── @access  Private
const getMyDetections = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [detections, total] = await Promise.all([
    DiseaseDetection.find({ farmer: req.user._id })
      .populate('crop', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    DiseaseDetection.countDocuments({ farmer: req.user._id }),
  ]);

  return res.status(200).json({
    success: true,
    data: detections,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ─── @desc    Submit feedback on detection accuracy
// ─── @route   PATCH /api/ai/detections/:id/feedback
// ─── @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { isAccurate, comment } = req.body;

  const detection = await DiseaseDetection.findOne({
    _id: req.params.id,
    farmer: req.user._id,
  });

  if (!detection) return errorResponse(res, 404, 'Detection not found');

  detection.userFeedback = { isAccurate, comment: comment || '', ratedAt: new Date() };
  await detection.save();

  return successResponse(res, 200, 'Feedback submitted. Thank you! 🙏', detection.userFeedback);
});

// ─── Mock helpers ─────────────────────────────────────────────────────────────
const getMockDiseaseResult = (cropName) => ({
  isHealthy: false,
  diseaseName: 'Early Blight (Alternaria solani)',
  diseaseType: 'fungal',
  confidenceScore: 87,
  severity: 'moderate',
  affectedArea: 35,
  symptoms: ['Brown circular spots with yellow halos', 'Lesions starting on older leaves', 'Premature leaf drop'],
  causes: ['Fungal pathogen Alternaria solani', 'High humidity and warm temperatures', 'Poor air circulation'],
});

const getMockTreatments = (diseaseName) => ({
  immediate: [
    'Remove and destroy all infected leaves immediately',
    'Avoid overhead irrigation — use drip irrigation',
    'Improve air circulation around plants',
  ],
  chemical: [
    { name: 'Mancozeb 75% WP', dosage: '2.5 g/litre of water', frequency: 'Every 7-10 days', precautions: 'Wear gloves and mask. Do not spray near water bodies.' },
    { name: 'Chlorothalonil', dosage: '2 g/litre of water', frequency: 'Every 10 days', precautions: 'Avoid contact with skin and eyes.' },
  ],
  organic: [
    'Spray neem oil solution (5ml/litre) every 7 days',
    'Apply copper-based fungicide (Bordeaux mixture)',
    'Use baking soda spray (1 tsp per litre of water)',
  ],
  preventive: [
    'Use certified disease-resistant varieties',
    'Practice crop rotation every season',
    'Maintain proper plant spacing for air circulation',
    'Apply mulch to prevent soil splash',
  ],
});

const getMockCropRecommendations = (soilType, season) => ({
  topCrops: [
    {
      name: 'Wheat',
      variety: 'HD-2967',
      suitabilityScore: 92,
      expectedYield: '4-5 tonnes/acre',
      growingPeriod: '4-5 months',
      waterRequirement: 'medium',
      profitability: 'high',
      reasons: [`Ideal for ${soilType} soil`, `Best suited for ${season} season`],
      tips: ['Apply basal dose of NPK before sowing', 'Irrigate at crown root initiation stage'],
    },
    {
      name: 'Mustard',
      variety: 'Pusa Bold',
      suitabilityScore: 85,
      expectedYield: '1.5-2 tonnes/acre',
      growingPeriod: '3-4 months',
      waterRequirement: 'low',
      profitability: 'medium',
      reasons: ['Drought tolerant', 'Good market demand'],
      tips: ['Sow in rows 30cm apart', 'Apply sulfur fertilizer for better oil content'],
    },
    {
      name: 'Chickpea',
      variety: 'Pusa 256',
      suitabilityScore: 78,
      expectedYield: '1-1.5 tonnes/acre',
      growingPeriod: '3-4 months',
      waterRequirement: 'low',
      profitability: 'medium',
      reasons: ['Nitrogen fixing — improves soil health', 'Low water requirement'],
      tips: ['Treat seeds with Rhizobium culture', 'Avoid waterlogging'],
    },
  ],
  soilAmendments: ['Add organic compost (2-3 tonnes/acre)', 'Apply lime if pH < 6.0'],
  generalAdvice: `Your ${soilType} soil is well-suited for ${season} crops. Focus on maintaining soil moisture and organic matter for best yields.`,
  warnings: ['Monitor for aphid infestation during flowering stage'],
});

const getMockChatReply = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('disease') || lower.includes('spot') || lower.includes('yellow')) {
    return "🌿 Based on your description, this could be a fungal infection. Try spraying neem oil solution (5ml per litre of water) every 7 days. Also remove affected leaves and improve air circulation. For accurate diagnosis, use our AI Disease Detection feature by uploading a photo of the affected crop!";
  }
  if (lower.includes('fertilizer') || lower.includes('npk') || lower.includes('soil')) {
    return "🌱 For balanced crop nutrition, apply NPK in ratio 4:2:1 for most crops. Add organic compost (2-3 tonnes/acre) to improve soil health. Get your soil tested for precise recommendations using our Soil Tracker feature!";
  }
  if (lower.includes('weather') || lower.includes('rain') || lower.includes('irrigation')) {
    return "🌤️ Check the Weather module for real-time forecasts and farming recommendations. As a general rule: irrigate early morning or evening during hot weather, and skip irrigation when rain is expected within 24 hours.";
  }
  return "🌱 Hello! I'm GreenBot, your farming assistant. I can help you with crop diseases, soil health, weather advice, and more. What farming challenge can I help you with today?";
};

module.exports = {
  detectDisease,
  getCropRecommendation,
  farmingChat,
  getMyDetections,
  submitFeedback,
};
