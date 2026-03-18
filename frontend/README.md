# Tuition Platform – Frontend (Web)

Main web application for parents, teachers, and students.

## Setup

```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL (e.g. http://localhost:3001)
npm run dev
```

Runs at http://localhost:5173 by default.

## Migration from Next.js

This project is a scaffold. To complete the migration:

1. Copy pages from `src/app/` (excluding admin) into `src/pages/`
2. Replace `useRouter` with `useNavigate`, `Link href` with `Link to`
3. Replace all `fetch('/api/...')` with `api('/api/...')` from `@/lib/api`
4. Set up React Router routes in `App.tsx`
5. Copy shared components and contexts

See `MIGRATION_PLAN.md` in the project root for full details.
