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
import { startHealthMonitor } from './services/health-monitor.js';
import { getAllProviderHealth } from './services/provider-health.js';

const PORT = process.env.PORT || 3006;

const app = express();

app.use(
  cors({
    origin: true,
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

app.get('/health/providers', async (_req: express.Request, res: express.Response) => {
  try {
    const [text, vision, audio] = await Promise.all([
      getAllProviderHealth('text'),
      getAllProviderHealth('vision'),
      getAllProviderHealth('audio'),
    ]);
    res.json({ text, vision, audio });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get provider health' });
  }
});

// Protected v1 routes - require API key or JWT
app.use('/v1/generate', authMiddleware, generateRoutes);
app.use('/v1/evaluate', authMiddleware, evaluateRoutes);
app.use('/v1/monitor', authMiddleware, monitorRoutes);
app.use('/v1/doubt', authMiddleware, doubtRoutes);
app.use('/v1/sentiment', authMiddleware, sentimentRoutes);

const server = app.listen(PORT, () => {
  console.log(`AI Service running at http://localhost:${PORT}`);
  console.log('Set GEMINI_API_KEY or OPENAI_API_KEY for AI features. Auth: X-API-Key or Authorization: Bearer <token>');
  startHealthMonitor();
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error('Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set PORT env var or stop the other process.`);
  }
  process.exit(1);
});
