# Tuition Platform – Backend API

Standalone Node.js + Express REST API. Deploy independently and connect from frontend, admin, and mobile app.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

API runs at `http://localhost:3001` by default.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_HERE_API_KEY` | HERE API for location |
| `RAZORPAY_KEY_ID` | Razorpay key (payments) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `CRON_SECRET` | Secret for cron endpoints |
| `PORT` | Server port (default: 3001) |
| `CORS_ORIGIN` | Comma-separated allowed origins |

## API Base URL

Clients should use: `http://localhost:3001` (dev) or `https://api.yourdomain.com` (prod).

All routes are under `/api/` (e.g. `/api/auth/login`, `/api/parent/profile`).
