# Quick Start

Get LearnBuddy running locally in a few minutes.

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (Docker or redis-server)
- Google Gemini API key (for AI features)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd tuition-platform
```

### 2. Environment files

Copy the example env files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
cp website/.env.example website/.env
cp app/.env.example app/.env
```

Edit `backend/.env` and `ai-service/.env`:

- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — any strong random string (same in both)
- `GEMINI_API_KEY` — from Google AI Studio
- `AI_SERVICE_API_KEY` — any secret (same in both when using AI service)
- `HERE_API_KEY` — (optional) HERE Maps API key for location/address autocomplete in forms

### 3. Install dependencies

```bash
cd backend && npm install && cd ..
cd ai-service && npm install && cd ..
cd frontend && npm install && cd ..
cd admin && npm install && cd ..
cd website && npm install && cd ..
cd app && npm install && cd ..
```

### 4. Seed data (optional)

```bash
cd backend
# Seed via API (requires backend running):
#   curl -X POST http://localhost:3005/api/seed-admin   # Admin login user
#   curl -X POST http://localhost:3005/api/seed-staff   # Staff users (for Users list)
# Or run standalone scripts:
npm run seed-cms-pages         # CMS pages (About, Contact, FAQ, Privacy, Terms)
npm run seed-website-settings  # Website settings (app store links, social URLs)
npm run seed-job-positions     # Job positions for Careers page
npm run seed-staff             # Staff users (admin, sales, marketing, hr, finance)
# For masters, topics: POST to /api/seed-masters, /api/seed-admin, /api/seed-topics
cd ..
```

---

## Run

### Option A: Start everything

From the project root:

```bash
./scripts/start-all.sh
```

This starts Redis (Docker or redis-server), then backend, AI service, frontend, admin, and website in the background.

### Option B: Start individually

In separate terminals:

```bash
# Terminal 1: Redis (if not using Docker)
redis-server

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: AI Service
cd ai-service && npm run dev

# Terminal 4: Frontend
cd frontend && npm run dev

# Terminal 5: Admin
cd admin && npm run dev

# Terminal 6: Website
cd website && npm run dev

# Terminal 7: App (optional)
cd app && npm start
```

---

## URLs

| Service | URL |
|---------|-----|
| Backend | http://localhost:3005 |
| AI Service | http://localhost:3006 |
| Frontend | http://localhost:3007 |
| Admin | http://localhost:3008 |
| Website | http://localhost:3009 |

---

## Verify

- Backend health: http://localhost:3005/health
- AI Service health: http://localhost:3006/health

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run generate-schedules` | Generate class schedules (from root) |
| `npm run clear-schedules` | Clear class schedules (from root) |

---

## Troubleshooting

**Redis not found:** Install Docker (`docker run -d -p 6379:6379 redis:7-alpine`) or `redis-server` (apt install redis-server).

**MongoDB connection failed:** Ensure MongoDB is running and `MONGODB_URI` is correct.

**CORS errors:** Add your client origin to `CORS_ORIGIN` in backend and ai-service `.env`.

**AI features not working:** Set `AI_SERVICE_URL` and `AI_SERVICE_API_KEY` in backend, or ensure `GEMINI_API_KEY` is set for fallback.
