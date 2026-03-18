# Production Deployment Guide

This document describes how to deploy LearnBuddy to production. Each application can be deployed independently.

---

## Prerequisites

- Node.js 18+
- MongoDB (Atlas or self-hosted)
- Redis (managed or self-hosted)
- Google Gemini API key
- Domain(s) and SSL certificates

---

## Deployment Steps

### 1. Backend

**Build:**
```bash
cd backend && npm install && npm run build
```

**Environment variables (production):**

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | Production MongoDB connection string |
| `JWT_SECRET` | Yes | Strong random string (32+ chars) |
| `GEMINI_API_KEY` | Yes* | Used when AI service is not configured |
| `PORT` | No | Default 3005 |
| `CORS_ORIGIN` | Yes | Comma-separated production client URLs |
| `REDIS_URL` | Yes | Redis for BullMQ, cache, token blacklist |
| `AI_SERVICE_URL` | No | AI service base URL (e.g. `https://ai.learnbuddy.com`) |
| `AI_SERVICE_API_KEY` | No | Must match AI service |
| `AI_MONITOR_JWT_SECRET` | No | Defaults to `JWT_SECRET` |
| `CRON_SECRET` | Yes | Secret for cron endpoints |
| `API_URL` or `BACKEND_URL` | Yes | Public backend URL (for email verification links) |

*Required if `AI_SERVICE_URL` is not set.

**Deploy:**
- Run `node dist/index.js` (or equivalent from compiled output)
- Use PM2, systemd, or container (Docker) for process management
- Set `NODE_ENV=production`

**Example (Railway):**

- Set env vars in dashboard
- Deploy from repo; build command: `cd backend && npm install && npm run build`
- Start command: `cd backend && node dist/index.js`

---

### 2. AI Service

**Build:**
```bash
cd ai-service && npm install && npm run build
```

**Environment variables (production):**

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `PORT` | No | Default 3006 |
| `CORS_ORIGIN` | Yes | Backend + clients (frontend, admin, app) |
| `REDIS_URL` | No | For AI output caching |
| `AI_SERVICE_API_KEY` | No | Must match backend |
| `JWT_SECRET` | No | Must match backend (for monitor tokens) |

**Deploy:**
- Run `node dist/index.js` or equivalent
- Ensure CORS includes all client origins

---

### 3. Frontend

**Build:**
```bash
cd frontend && npm install
VITE_API_BASE_URL=https://api.learnbuddy.com npm run build
```

**Environment variables (build time):**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Production backend URL |
| `VITE_BASE_URL` | No | CDN base for assets |

**Deploy:**
- Output: `dist/` — deploy as static site (Vercel, Netlify, S3 + CloudFront)
- Ensure SPA routing: redirect all routes to `index.html`

---

### 4. Admin

**Build:**
```bash
cd admin && npm install
VITE_API_BASE_URL=https://api.learnbuddy.com npm run build
```

**Deploy:**
- Same as frontend; deploy `dist/` to admin subdomain or path

---

### 5. Website

**Build:**
```bash
cd website && npm install
VITE_APP_URL=https://app.learnbuddy.com VITE_ADMIN_URL=https://admin.learnbuddy.com npm run build
```

**Environment variables (build time):**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_URL` | Yes | Main app URL |
| `VITE_ADMIN_URL` | Yes | Admin URL |

**Deploy:**
- Static site for marketing/landing page

---

### 6. App (Expo)

**Build:**
```bash
cd app && npm install
EXPO_PUBLIC_API_BASE_URL=https://api.learnbuddy.com eas build --platform all
```

**Deploy:**
- Use EAS Build for iOS and Android
- Submit to App Store / Play Store via EAS Submit

---

## Shared Secrets

| Secret | Used by | Must match |
|--------|---------|------------|
| `JWT_SECRET` | Backend, AI Service | Yes |
| `AI_SERVICE_API_KEY` | Backend, AI Service | Yes |

---

## Cron Jobs

Configure external cron (e.g. cron.io, GitHub Actions) to hit:

| Endpoint | Schedule | Header |
|----------|----------|--------|
| `POST /api/cron/generate-schedules` | Hourly | `X-Cron-Secret: <CRON_SECRET>` |
| `POST /api/cron/notifications` | Every 15 min | `X-Cron-Secret: <CRON_SECRET>` |

---

## Health Checks

| Service | URL |
|---------|-----|
| Backend | `GET /health` |
| AI Service | `GET /health` |

Configure load balancer or container health probes accordingly.

---

## Post-Deployment Checklist

- [ ] MongoDB and Redis accessible from production
- [ ] `CORS_ORIGIN` includes all client URLs
- [ ] `API_URL` / `BACKEND_URL` set for email verification links
- [ ] Cron jobs configured
- [ ] SSL/TLS enabled on all public endpoints
- [ ] `JWT_SECRET` and `AI_SERVICE_API_KEY` are strong and unique

---

## Related Documentation

- [COMPONENT-CONNECTIONS.md](./COMPONENT-CONNECTIONS.md) — env vars, API contracts
- [QUICK-START.md](./QUICK-START.md) — local setup
