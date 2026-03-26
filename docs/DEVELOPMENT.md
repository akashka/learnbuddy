# Development Guide

Technical guide for developers working on the GuruChakra codebase.

---

## Repository Structure

```
tuition-platform/
├── backend/       # Express API
├── ai-service/    # AI microservice
├── admin/         # Admin React app
├── frontend/      # Main React app
├── website/       # Marketing site
├── app/           # Expo mobile app
├── scripts/       # Shell scripts
└── docs/          # Documentation
```

Each app has its own `package.json`, dependencies, and build. No shared packages at the root (except root scripts).

---

## Local Setup

1. Install dependencies per app: `cd <app> && npm install`
2. Copy `.env.example` to `.env` in each app
3. Start MongoDB and Redis
4. Run `./scripts/start-all.sh` or start each service manually

See [QUICK-START.md](./QUICK-START.md) for details.

---

## Backend

### Structure

```
backend/
├── src/
│   ├── index.ts           # Entry, Express setup, routes
│   ├── routes.generated.ts # Auto-generated route registration
│   ├── adaptNextRoute.ts  # Adapts (req, res) to NextResponse-style
│   ├── api/               # Route handlers (Next.js-style)
│   │   ├── auth/
│   │   ├── parent/
│   │   ├── teacher/
│   │   ├── student/
│   │   ├── admin/
│   │   └── ...
│   └── lib/
│       ├── db.ts          # MongoDB connection
│       ├── redis.ts       # Redis client
│       ├── models/        # Mongoose models
│       ├── authMiddleware.ts
│       ├── ai-client.ts   # AI service HTTP client
│       └── queue.ts       # BullMQ jobs
├── scripts/
│   ├── gen-routes.mjs     # Generates routes.generated.ts
│   ├── generate-class-schedules.ts
│   └── clear-class-schedules.ts
└── package.json
```

### Adding a New API Route

1. Create `src/api/<domain>/<path>/route.ts`
2. Export `GET`, `POST`, `PUT`, `PATCH`, or `DELETE` handlers
3. Run `npm run gen-routes` to regenerate `routes.generated.ts`
4. Handlers receive `NextRequest`, return `NextResponse` (via `adaptNextRoute`)

### Route Pattern

```typescript
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';

export async function GET(request: NextRequest) {
  await connectDB();
  // ... logic
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const decoded = getAuthFromRequest(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | tsx watch, hot reload |
| `npm run build` | tsc |
| `npm run gen-routes` | Scan api/, generate routes |
| `npm run generate-schedules` | Run schedule generation |
| `npm run clear-schedules` | Clear class schedules |

---

## AI Service

### Structure

```
ai-service/
├── src/
│   ├── index.ts
│   ├── routes/    # generate, evaluate, monitor, doubt
│   ├── services/  # AI logic
│   ├── middleware/auth.ts
│   └── lib/
└── package.json
```

### Auth

Accepts `X-API-Key` or `Authorization: Bearer <JWT>`. JWT is used for monitor tokens (short-lived, issued by backend).

---

## Frontend / Admin

### Stack

- React 19, Vite 6, React Router 7, Tailwind 4
- `@/` alias for `src/`

### Structure

```
frontend/src/
├── App.tsx
├── components/
├── contexts/      # AuthContext, LanguageContext
├── pages/
├── lib/           # api.ts, etc.
└── ...
```

### API Calls

Use `apiJson(path, options)` from `lib/api.ts`. Base URL from `VITE_API_BASE_URL`. Attach JWT via `Authorization: Bearer <token>` (handled in api layer if using auth context).

---

## App (Expo)

### Stack

- Expo 52, React Navigation 7
- `EXPO_PUBLIC_API_BASE_URL` for backend

### Android Emulator

Use `http://10.0.2.2:3005` instead of `localhost` for API base URL.

---

## Conventions

- **TypeScript:** Strict mode. Prefer interfaces for request/response shapes.
- **Env:** Never commit `.env`. Use `.env.example` as template.
- **Secrets:** `JWT_SECRET` and `AI_SERVICE_API_KEY` must match across backend and AI service.
- **CORS:** Add new client origins to `CORS_ORIGIN` in backend and ai-service.

---

## Testing

No test framework is configured. See [TESTING.md](./TESTING.md) for the recommended test strategy, including:

- Backend: Jest or Vitest for route handlers
- Frontend: Vitest + React Testing Library
- E2E: Playwright or Cypress

---

## Debugging

- **Backend:** `tsx watch` logs to console. Use `requestId` (from middleware) for tracing.
- **AI Service:** Logs to console. Check `/health` for Redis.
- **Frontend:** React DevTools, Vite HMR.
- **MongoDB:** Use Compass or `mongosh` for data inspection.
- **Redis:** Use `redis-cli` for cache and BullMQ inspection.

---

## Common Tasks

**Regenerate routes after adding API:**  
`cd backend && npm run gen-routes`

**Clear and regenerate schedules:**  
`npm run clear-schedules && npm run generate-schedules`

**Seed data:**  
`cd backend && npm run seed-cms-pages` (CMS pages). For masters/admin/topics: POST to `/api/seed-masters`, `/api/seed-admin`, `/api/seed-topics` (backend must be running).
