/// <reference path="./global.d.ts" />
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from './routes.generated.js';
import { adaptNextRoute } from './adaptNextRoute.js';
import { POST as POST_job_applications } from './api/website/job-applications/route.js';
import { authMiddleware } from './lib/authMiddleware.js';
import { auditMiddleware } from './lib/auditMiddleware.js';
import { uploadJd } from './lib/upload.js';
import connectDB from './lib/db.js';
import { JobPosition } from './lib/models/JobPosition.js';
import { redisHealth } from './lib/redis.js';
import { requestIdMiddleware } from './lib/requestId.js';
import { startWorker, setupRepeatJobs, closeQueue } from './lib/queue.js';
import { initSocketIO } from './lib/socket.js';

const PORT = process.env.PORT || 3005;

const app = express();

// Request ID for tracing across services (must run first)
app.use(requestIdMiddleware);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
// 15MB limit for JSON body - teacher registration step 4 sends base64 documents (up to 5 × 2MB)
app.use(express.json({ limit: '15mb' }));

// Stricter rate limits for auth endpoints: 5 req/min per IP (reduces brute-force and OTP abuse)
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/registration/send-otp'];
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !AUTH_PATHS.includes(req.path),
});
app.use(authLimiter);

// General rate limiting: configurable via RATE_LIMIT_MAX (default 500 req/15min per IP)
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '500', 10);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});
app.use(limiter);

// Audit logging for compliance - runs for all requests, logs on finish for admin mutations
app.use(auditMiddleware);

registerRoutes(app);

// Job applications (multipart) - excluded from gen-routes, uses raw body for formData()
app.post('/api/website/job-applications', adaptNextRoute(POST_job_applications));

// JD upload - uses multer for reliable multipart parsing (admin only)
app.post(
  '/api/admin/job-positions/:id/jd',
  authMiddleware,
  (req, res, next) => {
    uploadJd(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'JD file must be under 25MB' });
        if (err.message?.includes('PDF')) return res.status(400).json({ error: 'Only PDF files are allowed' });
        console.error('Multer JD error:', err);
        return res.status(500).json({ error: 'Failed to upload' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'ID required' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'JD file is required' });
        return;
      }
      await connectDB();
      const position = await JobPosition.findById(id);
      if (!position) {
        res.status(404).json({ error: 'Position not found' });
        return;
      }
      const jdUrl = `/api/uploads/${req.file.filename}`;
      position.jdUrl = jdUrl;
      await position.save();
      res.json({ jdUrl, message: 'JD uploaded successfully' });
    } catch (err) {
      console.error('JD upload error:', err);
      res.status(500).json({ error: 'Failed to upload' });
    }
  }
);

// Serve uploaded files (JD, resumes)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.get('/api/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(path.resolve(filepath));
});

app.get('/health', async (_req, res) => {
  const checks: Record<string, { ok: boolean; message?: string }> = {};
  try {
    await connectDB();
    checks.mongodb = { ok: true };
  } catch (err) {
    checks.mongodb = { ok: false, message: err instanceof Error ? err.message : 'Connection failed' };
  }
  checks.redis = await redisHealth();

  const mongoOk = checks.mongodb.ok;
  res.status(mongoOk ? 200 : 503).json({
    ok: mongoOk,
    timestamp: new Date().toISOString(),
    checks,
  });
});

const httpServer = createServer(app);
initSocketIO(httpServer);

const server = httpServer.listen(PORT, async () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
  console.log('Registered routes:');
  startWorker();
  await setupRepeatJobs();
});

async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  server.close();
  await closeQueue();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
