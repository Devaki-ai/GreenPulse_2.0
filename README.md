# 🌱 GreenPulse — AI-Powered Smart Agriculture Platform

> A full-stack portfolio project built with Next.js 14, Node.js, MongoDB, and OpenAI

---

## 🚀 Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | Next.js 14 + TypeScript + Tailwind CSS |
| Backend    | Node.js + Express.js |
| Database   | MongoDB + Mongoose |
| AI         | OpenAI GPT-4 Vision / Gemini API |
| Weather    | OpenWeatherMap API |
| Images     | Cloudinary |
| Auth       | JWT + bcrypt |
| State      | Zustand + React Query |
| Charts     | Recharts |
| Animation  | Framer Motion |

---

## 📁 Project Structure

```
greenpulse/
├── backend/
│   ├── src/
│   │   ├── config/         # DB + Cloudinary config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error, rate limiting
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   └── utils/          # Helpers
│   ├── uploads/            # Temp file uploads
│   ├── .env                # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js App Router pages
    │   ├── components/     # Reusable UI components
    │   ├── lib/            # Axios, utils
    │   ├── store/          # Zustand state
    │   └── types/          # TypeScript types
    ├── .env.local
    └── package.json
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Backend Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cd backend
cp .env.example .env
```

Required variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/greenpulse
JWT_SECRET=your_secret_key_here
OPENAI_API_KEY=sk-...          # Get from platform.openai.com
WEATHER_API_KEY=...            # Get from openweathermap.org (free)
CLOUDINARY_CLOUD_NAME=...      # Get from cloudinary.com (free)
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:3000
```

---

### 3. Configure Frontend Environment

```bash
cd frontend
# .env.local is already created, update if needed:
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 4. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

---

### 5. Verify Setup

- Backend health check: http://localhost:5000/health
- Frontend: http://localhost:3000
- API base: http://localhost:5000/api

---

## 🔑 API Keys Setup

### OpenAI (AI Disease Detection + Chatbot)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `backend/.env` as `OPENAI_API_KEY`
> Without this key, the app uses rich mock data for demos

### OpenWeatherMap (Weather Forecasts)
1. Go to https://openweathermap.org/api
2. Sign up free → My API Keys
3. Add to `backend/.env` as `WEATHER_API_KEY`
> Without this key, mock weather data is returned

### Cloudinary (Image Uploads)
1. Go to https://cloudinary.com → Sign up free
2. Dashboard → Copy Cloud Name, API Key, API Secret
3. Add all three to `backend/.env`

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| PUT  | `/api/auth/update-profile` | Update profile |
| PUT  | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request reset |
| PUT  | `/api/auth/reset-password/:token` | Reset password |

### Crops
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/crops` | Get all my crops |
| POST | `/api/crops` | Add new crop |
| PUT  | `/api/crops/:id` | Update crop |
| DELETE | `/api/crops/:id` | Delete crop |
| PATCH | `/api/crops/:id/growth-stage` | Update growth stage |
| GET  | `/api/crops/health-summary` | Health overview |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/detect-disease` | Detect crop disease from image |
| POST | `/api/ai/crop-recommendation` | Get crop recommendations |
| POST | `/api/ai/chat` | GreenBot chatbot |
| GET  | `/api/ai/detections` | Scan history |

### Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather?city=Mumbai` | Weather by city |
| GET | `/api/weather/coords?lat=19&lng=72` | Weather by coordinates |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/marketplace` | Browse all products |
| POST | `/api/marketplace` | Create listing |
| GET  | `/api/marketplace/trends` | Market price trends |
| POST | `/api/marketplace/:id/reviews` | Add review |

---

## 🎨 Features

- ✅ **Farmer Dashboard** — Stats, crop health, quick actions
- ✅ **AI Disease Detection** — GPT-4 Vision with treatment plans
- ✅ **Crop Recommendation** — Based on soil + season + location
- ✅ **Weather Forecast** — 7-day forecast + farming tips
- ✅ **Soil Tracker** — NPK, pH, moisture with charts
- ✅ **Marketplace** — Buy/sell crops, fertilizers, equipment
- ✅ **GreenBot** — AI chatbot for farming advice
- ✅ **Admin Panel** — Analytics, user management, moderation
- ✅ **Dark Mode** — Full dark/light theme support
- ✅ **JWT Auth** — Secure login with role-based access
- ✅ **Responsive** — Mobile-first design

---

## 🏗️ Production Build

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm start
```

---

## 📝 License

MIT — Free to use for portfolio and learning purposes.

Built with 💚 for Indian farmers.
