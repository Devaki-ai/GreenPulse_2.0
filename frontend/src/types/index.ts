// ─── User Types ───────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'farmer' | 'buyer' | 'admin';
  avatar: string;
  phone: string;
  location: {
    village: string;
    district: string;
    state: string;
    country: string;
    pincode: string;
    coordinates: { lat: number | null; lng: number | null };
  };
  farmDetails: {
    farmSize: number;
    soilType: string;
    irrigationType: string;
    primaryCrops: string[];
  };
  preferences: {
    language: string;
    notifications: boolean;
    darkMode: boolean;
  };
  isVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  fullLocation?: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'farmer' | 'buyer';
  phone?: string;
}

// ─── Crop Types ───────────────────────────────────────────────────────────────
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type GrowthStage = 'seed' | 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity' | 'harvest';
export type Season = 'kharif' | 'rabi' | 'zaid' | 'year-round';

export interface Crop {
  _id: string;
  farmer: string;
  name: string;
  variety: string;
  category: string;
  season: Season;
  fieldArea: number;
  sowingDate: string | null;
  expectedHarvestDate: string | null;
  currentGrowthStage: GrowthStage;
  healthStatus: HealthStatus;
  healthScore: number;
  soilInfo: {
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    moisture: number;
    organicMatter: number;
  };
  waterRequirement: 'low' | 'medium' | 'high';
  images: { url: string; publicId: string; caption: string; uploadedAt: string }[];
  notes: string;
  isActive: boolean;
  aiInsights: {
    lastAnalyzed: string | null;
    recommendations: string[];
    riskFactors: string[];
  };
  daysSinceSowing?: number;
  daysToHarvest?: number;
  createdAt: string;
}

// ─── Weather Types ────────────────────────────────────────────────────────────
export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy' | 'windy' | 'hazy';

export interface WeatherCurrent {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  cloudCover: number;
  description: string;
  icon: string;
  condition: WeatherCondition;
}

export interface WeatherForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  description: string;
  icon: string;
  condition: WeatherCondition;
  farmingAdvice: string;
}

export interface WeatherData {
  location: { city: string; state?: string; country: string; lat: number; lng: number };
  current: WeatherCurrent;
  forecast: WeatherForecastDay[];
  farmingRecommendations: {
    irrigation: string;
    pestControl: string;
    harvesting: string;
    planting: string;
    general: string;
  };
  alerts?: { type: string; severity: string; message: string }[];
}

// ─── Soil Types ───────────────────────────────────────────────────────────────
export interface SoilRecord {
  _id: string;
  farmer: string;
  crop?: { _id: string; name: string; variety: string } | null;
  fieldName: string;
  soilType: string;
  nutrients: {
    nitrogen: { value: number; status: 'low' | 'medium' | 'high' };
    phosphorus: { value: number; status: 'low' | 'medium' | 'high' };
    potassium: { value: number; status: 'low' | 'medium' | 'high' };
  };
  ph: { value: number; status: string };
  moisture: { value: number; status: 'dry' | 'optimal' | 'wet' };
  organicMatter: { value: number; status: 'low' | 'medium' | 'high' };
  testMethod: string;
  testDate: string;
  aiRecommendations: {
    fertilizers: string[];
    amendments: string[];
    suitableCrops: string[];
    generalAdvice: string;
  };
  healthScore?: number;
  notes: string;
  createdAt: string;
}

// ─── Disease Detection Types ──────────────────────────────────────────────────
export interface DiseaseDetection {
  _id: string;
  farmer: string;
  crop?: { _id: string; name: string } | null;
  cropName: string;
  image: { url: string; publicId: string };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: {
    isHealthy: boolean;
    diseaseName: string;
    diseaseType: string;
    confidenceScore: number;
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'critical';
    affectedArea: number;
    symptoms: string[];
    causes: string[];
  };
  treatments: {
    immediate: string[];
    chemical: { name: string; dosage: string; frequency: string; precautions: string }[];
    organic: string[];
    preventive: string[];
  };
  confidenceLabel?: string;
  processingTime: number;
  createdAt: string;
}

// ─── Marketplace Types ────────────────────────────────────────────────────────
export interface Product {
  _id: string;
  seller: { _id: string; name: string; avatar: string; location?: { state: string; district: string } };
  title: string;
  description: string;
  category: 'crop' | 'fertilizer' | 'pesticide' | 'equipment' | 'seed' | 'tool' | 'other';
  price: { amount: number; currency: string; unit: string; negotiable: boolean };
  quantity: { available: number; unit: string; minimum: number };
  images: { url: string; publicId: string; isPrimary: boolean }[];
  location: { village: string; district: string; state: string; pincode: string };
  status: 'active' | 'sold' | 'inactive' | 'pending_review';
  ratings: { average: number; count: number };
  views: number;
  organicCertified: boolean;
  tags: string[];
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────
export interface DashboardStats {
  overview: {
    totalCrops: number;
    activeCrops: number;
    healthyCrops: number;
    healthPercentage: number;
    totalScans: number;
  };
  healthDistribution: Record<string, number>;
  recentCrops: Crop[];
  recentScans: DiseaseDetection[];
  latestSoilRecord: SoilRecord | null;
}
