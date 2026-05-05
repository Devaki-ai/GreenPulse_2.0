const axios = require('axios');
const DiseaseDetection = require('../models/DiseaseDetection');
const Crop = require('../models/Crop');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

// ─── Gemini helpers ───────────────────────────────────────────────────────────
const getGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key-here') return null;
  return key;
};

const callGeminiWithImage = async (imageUrl, prompt) => {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const base64Image = Buffer.from(imageRes.data).toString('base64');
  const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Image } }] }],
      generationConfig: { response_mime_type: 'application/json' },
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return JSON.parse(text);
};

const callGeminiText = async (prompt) => {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: 'application/json' },
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return JSON.parse(text);
};

const callGeminiChat = async (messages) => {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { contents },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

// ─── @desc    Detect crop disease from image
// ─── @route   POST /api/ai/detect-disease
// ─── @access  Private
const detectDisease = asyncHandler(async (req, res) => {
  const { cropName, cropId } = req.body;
  if (!cropName) return errorResponse(res, 400, 'Please provide the crop name');
  if (!req.file) return errorResponse(res, 400, 'Please upload a crop image');

  const startTime = Date.now();

  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    folder: 'greenpulse/disease-scans',
    width: 1024,
    crop: 'limit',
  });

  const detection = await DiseaseDetection.create({
    farmer: req.user._id,
    crop: cropId || null,
    cropName,
    image: { url: uploadResult.secure_url, publicId: uploadResult.public_id },
    status: 'processing',
  });

  let result, treatments, aiProvider = 'mock';

  const prompt = `You are an expert agricultural plant pathologist AI. Analyze this crop image and provide a detailed disease diagnosis.
Crop: ${cropName}
Respond ONLY with a valid JSON object:
{
  "isHealthy": boolean,
  "diseaseName": "string (or 'Healthy' if no disease)",
  "diseaseType": "fungal|bacterial|viral|pest|nutrient_deficiency|environmental|none|unknown",
  "confidenceScore": number (0-100),
  "severity": "none|mild|moderate|severe|critical",
  "affectedArea": number (0-100),
  "symptoms": ["symptom1"],
  "causes": ["cause1"],
  "treatments": {
    "immediate": ["action1"],
    "chemical": [{"name": "product", "dosage": "amount", "frequency": "schedule", "precautions": "safety"}],
    "organic": ["remedy1"],
    "preventive": ["tip1"]
  }
}`;

  try {
    const parsed = await callGeminiWithImage(uploadResult.secure_url, prompt);
    if (parsed) {
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
      aiProvider = 'gemini';
      logger.success(`Disease detection via Gemini for ${cropName}`);
    } else {
      throw new Error('No Gemini key');
    }
  } catch (err) {
    logger.warn(`AI failed: ${err.message} — using mock data`);
    result = getMockDiseaseResult(cropName);
    treatments = getMockTreatments(result.diseaseName);
    aiProvider = 'mock';
  }

  const processingTime = Date.now() - startTime;
  detection.status = 'completed';
  detection.result = result;
  detection.treatments = treatments;
  detection.aiProvider = aiProvider;
  detection.processingTime = processingTime;
  await detection.save();

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

// ─── @desc    Get crop recommendations
// ─── @route   POST /api/ai/crop-recommendation
// ─── @access  Private
const getCropRecommendation = asyncHandler(async (req, res) => {
  const { soilType, ph, nitrogen, phosphorus, potassium, state, season, rainfall, temperature } = req.body;
  if (!soilType || !season) return errorResponse(res, 400, 'Please provide soilType and season');

  const prompt = `You are an expert agricultural advisor AI for Indian farmers. Recommend the best crops based on:
Soil Type: ${soilType}, pH: ${ph || 7}, N: ${nitrogen || 0} kg/ha, P: ${phosphorus || 0} kg/ha, K: ${potassium || 0} kg/ha
State: ${state || 'India'}, Season: ${season}, Rainfall: ${rainfall || 'unknown'} mm, Temp: ${temperature || 'unknown'}°C

Respond ONLY with valid JSON:
{
  "topCrops": [{"name":"crop","variety":"var","suitabilityScore":85,"expectedYield":"X tonnes/acre","growingPeriod":"X months","waterRequirement":"low|medium|high","profitability":"low|medium|high","reasons":["r1"],"tips":["t1"]}],
  "soilAmendments": ["a1"],
  "generalAdvice": "advice",
  "warnings": ["w1"]
}`;

  let recommendations;
  try {
    const parsed = await callGeminiText(prompt);
    recommendations = parsed || getMockCropRecommendations(soilType, season);
    if (parsed) logger.success('Crop recommendations via Gemini');
  } catch (err) {
    logger.warn(`Gemini crop rec failed: ${err.message} — using mock`);
    recommendations = getMockCropRecommendations(soilType, season);
  }

  return successResponse(res, 200, 'Crop recommendations generated', recommendations);
});

// ─── @desc    AI farming chatbot
// ─── @route   POST /api/ai/chat
// ─── @access  Private
const farmingChat = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message || message.trim().length === 0) return errorResponse(res, 400, 'Please provide a message');

  const systemMsg = `You are GreenBot 🌱, an expert AI farming assistant for GreenPulse. Help Indian farmers with crop diseases, soil health, weather advice, pest management, organic farming, market prices, and government schemes. Be friendly, simple, and practical. If asked in Hindi or regional language, respond in that language.`;

  const chatHistory = [
    { role: 'user', content: systemMsg },
    { role: 'assistant', content: 'I am GreenBot, ready to help farmers!' },
    ...history.slice(-10),
    { role: 'user', content: message },
  ];

  let reply;
  try {
    reply = await callGeminiChat(chatHistory);
    if (!reply) throw new Error('No Gemini key');
    logger.info('GreenBot replied via Gemini');
  } catch (err) {
    logger.warn(`GreenBot AI failed: ${err.message} — using mock`);
    reply = getMockChatReply(message);
  }

  return successResponse(res, 200, 'Chat response', { reply, isDemo: !getGeminiKey() });
});

// ─── @desc    Get all disease detections for farmer
// ─── @route   GET /api/ai/detections
// ─── @access  Private
const getMyDetections = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const [detections, total] = await Promise.all([
    DiseaseDetection.find({ farmer: req.user._id }).populate('crop', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    DiseaseDetection.countDocuments({ farmer: req.user._id }),
  ]);
  return res.status(200).json({ success: true, data: detections, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// ─── @desc    Submit feedback
// ─── @route   PATCH /api/ai/detections/:id/feedback
// ─── @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { isAccurate, comment } = req.body;
  const detection = await DiseaseDetection.findOne({ _id: req.params.id, farmer: req.user._id });
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

const getMockTreatments = () => ({
  immediate: ['Remove and destroy all infected leaves immediately', 'Avoid overhead irrigation — use drip irrigation', 'Improve air circulation around plants'],
  chemical: [
    { name: 'Mancozeb 75% WP', dosage: '2.5 g/litre of water', frequency: 'Every 7-10 days', precautions: 'Wear gloves and mask.' },
    { name: 'Chlorothalonil', dosage: '2 g/litre of water', frequency: 'Every 10 days', precautions: 'Avoid contact with skin and eyes.' },
  ],
  organic: ['Spray neem oil solution (5ml/litre) every 7 days', 'Apply copper-based fungicide (Bordeaux mixture)', 'Use baking soda spray (1 tsp per litre of water)'],
  preventive: ['Use certified disease-resistant varieties', 'Practice crop rotation every season', 'Maintain proper plant spacing', 'Apply mulch to prevent soil splash'],
});

const getMockCropRecommendations = (soilType, season) => ({
  topCrops: [
    { name: 'Wheat', variety: 'HD-2967', suitabilityScore: 92, expectedYield: '4-5 tonnes/acre', growingPeriod: '4-5 months', waterRequirement: 'medium', profitability: 'high', reasons: [`Ideal for ${soilType} soil`, `Best for ${season}`], tips: ['Apply NPK before sowing', 'Irrigate at crown root stage'] },
    { name: 'Mustard', variety: 'Pusa Bold', suitabilityScore: 85, expectedYield: '1.5-2 tonnes/acre', growingPeriod: '3-4 months', waterRequirement: 'low', profitability: 'medium', reasons: ['Drought tolerant', 'Good market demand'], tips: ['Sow in rows 30cm apart', 'Apply sulfur fertilizer'] },
    { name: 'Chickpea', variety: 'Pusa 256', suitabilityScore: 78, expectedYield: '1-1.5 tonnes/acre', growingPeriod: '3-4 months', waterRequirement: 'low', profitability: 'medium', reasons: ['Nitrogen fixing', 'Low water requirement'], tips: ['Treat seeds with Rhizobium', 'Avoid waterlogging'] },
  ],
  soilAmendments: ['Add organic compost (2-3 tonnes/acre)', 'Apply lime if pH < 6.0'],
  generalAdvice: `Your ${soilType} soil is well-suited for ${season} crops. Focus on maintaining soil moisture and organic matter.`,
  warnings: ['Monitor for aphid infestation during flowering stage'],
});

const getMockChatReply = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('disease') || lower.includes('spot') || lower.includes('yellow'))
    return '🌿 This could be a fungal infection. Try neem oil (5ml/litre) every 7 days. Remove affected leaves and improve air circulation. Upload a photo for accurate AI diagnosis!';
  if (lower.includes('fertilizer') || lower.includes('npk') || lower.includes('soil'))
    return '🌱 Apply NPK in ratio 4:2:1 for most crops. Add organic compost (2-3 tonnes/acre). Use our Soil Tracker for precise recommendations!';
  if (lower.includes('weather') || lower.includes('rain') || lower.includes('irrigation'))
    return '🌤️ Irrigate early morning or evening during hot weather. Skip irrigation when rain is expected within 24 hours. Check the Weather module for forecasts!';
  return '🌱 Hello! I\'m GreenBot, your farming assistant. Ask me about crop diseases, soil health, weather advice, or farming practices!';
};

module.exports = { detectDisease, getCropRecommendation, farmingChat, getMyDetections, submitFeedback };
