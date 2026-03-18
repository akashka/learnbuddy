/**
 * AI Service - Independent microservice for multi-model AI
 * See docs/AI-SERVICE-ARCHITECTURE.md for full design
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth.js';
import generateRoutes from './routes/generate.js';
import evaluateRoutes from './routes/evaluate.js';
import monitorRoutes from './routes/monitor.js';
import doubtRoutes from './routes/doubt.js';
import sentimentRoutes from './routes/sentiment.js';
import { redisHealth } from './lib/redis.js';

const PORT = process.env.PORT || 3006;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3005,http://localhost:3007,http://localhost:3008,http://localhost:3009';

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' })); // For base64 images

// Rate limiting: 60 req/min for AI endpoints (expensive)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});
app.use(limiter);

app.get('/health', async (_req: express.Request, res: express.Response) => {
  const redis = await redisHealth();
  res.json({
    ok: true,
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    checks: { redis },
  });
});

// Protected v1 routes - require API key or JWT
app.use('/v1/generate', authMiddleware, generateRoutes);
app.use('/v1/evaluate', authMiddleware, evaluateRoutes);
app.use('/v1/monitor', authMiddleware, monitorRoutes);
app.use('/v1/doubt', authMiddleware, doubtRoutes);
app.use('/v1/sentiment', authMiddleware, sentimentRoutes);

app.listen(PORT, () => {
  console.log(`AI Service running at http://localhost:${PORT}`);
  console.log('Set GEMINI_API_KEY for AI features. Auth: X-API-Key or Authorization: Bearer <token>');
});
