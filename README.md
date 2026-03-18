# Tuition Platform (LearnBuddy)

Multi-project layout: backend, admin, frontend, website, AI service, and app – each deployed independently.

## Quick Start

| Project    | Command                      | URL                    |
|------------|------------------------------|------------------------|
| Backend    | `cd backend && npm run dev`  | http://localhost:3005 |
| AI Service | `cd ai-service && npm run dev` | http://localhost:3006 |
| Frontend   | `cd frontend && npm run dev`  | http://localhost:3007 |
| Admin      | `cd admin && npm run dev`    | http://localhost:3008 |
| Website    | `cd website && npm run dev`  | http://localhost:3009 |
| App        | `cd app && npm start`        | Expo (mobile)          |

**Start all:** `./scripts/start-all.sh` (starts Redis via Docker or redis-server, then all services)

## Structure

```
├── backend/     # Node.js + Express API (117 routes)
├── ai-service/ # AI microservice (multi-model, monitoring)
├── admin/      # Admin web app (React + Vite)
├── frontend/   # Main web app (React + Vite)
├── website/    # Marketing/landing website
├── app/        # Mobile app (Expo)
├── docs/       # Documentation
└── scripts/    # Convenience scripts
```

## Environment

- **Backend:** `.env` with `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`. Optional: `REDIS_URL` (caching), `AI_SERVICE_URL`, `AI_SERVICE_API_KEY` to use AI service.
- **AI Service:** `.env` with `GEMINI_API_KEY`. Optional: `REDIS_URL` (AI output caching), `AI_SERVICE_API_KEY`, `JWT_SECRET` for auth.
- **Frontend/Admin:** `.env` with `VITE_API_BASE_URL=http://localhost:3005`

**Redis:** `start-all.sh` starts Redis locally (Docker or redis-server). `REDIS_URL=redis://localhost:6379` is set in backend and ai-service .env.

## Documentation

See [docs/](./docs/) for architecture, data flow, component connections, and quick start.
