# Scripts

Convenience scripts for the tuition platform.

## Start All Services

```bash
./scripts/start-all.sh
```

Starts backend (3001), AI service (3002), frontend (5173), admin (5174), website (5175).

## Backend Scripts

Backend-specific scripts live in `backend/scripts/`:

| Script | Purpose |
|--------|---------|
| `gen-routes.mjs` | Generate Express routes from API folder |
| `generate-class-schedules.ts` | Generate class schedules |
| `clear-class-schedules.ts` | Clear class schedules |
| `debug-class-sessions.ts` | Debug class sessions |

## Running from Root

```bash
# Generate class schedules (requires backend .env)
cd backend && npm run generate-schedules

# Clear class schedules
cd backend && npm run clear-schedules

# Regenerate API routes (after adding new route.ts files)
cd backend && npm run gen-routes
```
