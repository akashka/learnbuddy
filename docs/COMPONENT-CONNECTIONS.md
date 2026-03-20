# Component Connections

This document details how the LearnBuddy applications connect to each other—environment variables, API contracts, and deployment considerations.

---

## Connection Overview

```
                    ┌─────────────────────────────────────────┐
                    │  VITE_API_BASE_URL / EXPO_PUBLIC_*     │
                    └─────────────────────────────────────────┘
                                         │
Frontend, Admin, App ────────────────────┼──────────────────► Backend (:3005)
                                         │
                    ┌─────────────────────────────────────────┐
                    │  AI_SERVICE_URL + X-API-Key             │
                    └─────────────────────────────────────────┘
                                         │
Backend ─────────────────────────────────┼──────────────────► AI Service (:3006)
                                         │
                    ┌─────────────────────────────────────────┐
                    │  monitor-token → JWT → AI Service       │
                    └─────────────────────────────────────────┘
                                         │
Frontend, App ───────────────────────────┼──────────────────► AI Service (:3006)
         (direct, for real-time monitoring)
```

---

## Environment Variables by Component

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs. Must match AI service when using JWT auth |
| `GEMINI_API_KEY` | Yes* | Google Gemini (free tier) |
| `GROQ_API_KEY` | No | Groq – free, ultra-fast |
| `HF_TOKEN` | No | Hugging Face Inference – free tier |
| `OPENROUTER_API_KEY` | No | OpenRouter – free models |
| `CLOUDFLARE_ACCOUNT_ID` | No | Cloudflare Workers AI (with CLOUDFLARE_API_TOKEN) |
| `CLOUDFLARE_API_TOKEN` | No | Cloudflare Workers AI |
| `TOGETHER_API_KEY` | No | Together AI – free models |
| `OPENAI_API_KEY` | No | OpenAI – $5 free credits |
| `PORT` | No | Default 3005 |
| `CORS_ORIGIN` | No | Comma-separated origins. Default: frontend, admin, website |
| `REDIS_URL` | No | Redis for cache, BullMQ, token blacklist |
| `AI_SERVICE_URL` | No | AI service base URL (e.g. `http://localhost:3006`) |
| `AI_SERVICE_API_KEY` | No | API key for backend→AI calls. Must match AI service |
| `AI_MONITOR_JWT_SECRET` | No | For monitor tokens. Defaults to `JWT_SECRET` |
| `CRON_SECRET` | No | Secret for cron endpoints |
| `NEXT_PUBLIC_HERE_API_KEY` | No | For location features |

*At least one of GEMINI_API_KEY or OPENAI_API_KEY is required if AI_SERVICE_URL is not set.

### AI Service (`ai-service/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default 3006 |
| `CORS_ORIGIN` | No | Comma-separated origins (backend + clients) |
| `GEMINI_API_KEY` | Yes* | Google Gemini |
| `GROQ_API_KEY` | No | Groq |
| `HF_TOKEN` | No | Hugging Face Inference |
| `OPENROUTER_API_KEY` | No | OpenRouter |
| `CLOUDFLARE_ACCOUNT_ID` | No | Cloudflare Workers AI |
| `CLOUDFLARE_API_TOKEN` | No | Cloudflare Workers AI |
| `TOGETHER_API_KEY` | No | Together AI |
| `OPENAI_API_KEY` | No | OpenAI |
| `REDIS_URL` | No | For AI output caching |
| `AI_SERVICE_API_KEY` | No | Must match backend when using API key auth |
| `JWT_SECRET` | No | Must match backend when validating monitor JWTs |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend URL (e.g. `http://localhost:3005`) |
| `VITE_BASE_URL` | No | CDN base for assets |

### Admin (`admin/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend URL |
| `VITE_BASE_URL` | No | CDN base for assets |

### Website (`website/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_URL` | Yes | Main app URL (for "Open App" links) |
| `VITE_ADMIN_URL` | Yes | Admin URL (for "Admin" links) |

### App (`app/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Backend URL. Use `http://10.0.2.2:3005` for Android emulator |

---

## Shared Secrets

When deploying, ensure these match across services:

| Secret | Used by | Purpose |
|--------|---------|---------|
| `JWT_SECRET` | Backend, AI Service | Signing/validating JWTs and monitor tokens |
| `AI_SERVICE_API_KEY` | Backend, AI Service | Authenticating backend→AI calls |

---

## API Base Paths

All backend routes are under `/api/`. Examples:

- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/logout`
- Parent: `/api/parent/*` (profile, students, checkout, classes, wishlist, etc.)
- Teacher: `/api/teacher/*` (profile, batches, classes, payments, exams)
- Student: `/api/student/*` (profile, courses, classes, exams)
- Admin: `/api/admin/*` (users, teachers, parents, students, enrollments, masters, etc.)
- Masters: `/api/masters`, `/api/board-class-subjects`
- Notifications: `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/mark-read`
- AI: `/api/ai/monitor-token`
- Cron: `/api/cron/generate-schedules`, `/api/cron/notifications`

AI service routes are under `/v1/`:

- `/v1/generate/*` — exam, study material, and flashcard generation
- `/v1/evaluate/*` — exam evaluation
- `/v1/monitor/*` — classroom, exam, document verification
- `/v1/doubt/*` — doubt answering

---

## Auth Headers

**Backend API:**

```
Authorization: Bearer <jwt>
```

**Backend → AI Service:**

```
X-API-Key: <AI_SERVICE_API_KEY>
```

**Client → AI Service (monitoring):**

```
Authorization: Bearer <monitor_jwt>
```

The monitor JWT is obtained from `POST /api/ai/monitor-token` and is short-lived (2 hours).

---

## CORS

Each service has its own CORS config. In production, set `CORS_ORIGIN` to include all client origins, e.g.:

- Backend: `https://app.example.com,https://admin.example.com,https://website.example.com`
- AI Service: `https://api.example.com,https://app.example.com,https://admin.example.com`

---

## Deployment Checklist

1. **Backend**
   - Set `MONGODB_URI` to production MongoDB
   - Set `JWT_SECRET` (strong, random)
   - Set `REDIS_URL` for jobs and cache
   - Set `CORS_ORIGIN` to production client URLs
   - Optionally set `AI_SERVICE_URL` and `AI_SERVICE_API_KEY`

2. **AI Service**
   - Set `GEMINI_API_KEY`
   - Set `JWT_SECRET` same as backend
   - Set `AI_SERVICE_API_KEY` same as backend
   - Set `CORS_ORIGIN` to include backend and clients

3. **Frontend / Admin**
   - Set `VITE_API_BASE_URL` to production backend URL

4. **Website**
   - Set `VITE_APP_URL` and `VITE_ADMIN_URL` to production URLs

5. **App**
   - Set `EXPO_PUBLIC_API_BASE_URL` to production backend URL

6. **Cron**
   - Configure external cron (e.g. cron.io) to hit `/api/cron/generate-schedules` and `/api/cron/notifications` with `CRON_SECRET` header if required.
