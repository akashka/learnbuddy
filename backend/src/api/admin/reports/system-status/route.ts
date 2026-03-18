import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { redisHealth } from '@/lib/redis';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || '';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

interface ServiceStatus {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  message?: string;
}

async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const start = Date.now();
  const result = await fn();
  const latencyMs = Date.now() - start;
  return { result, latencyMs };
}

/** GET - System health: backend, AI service, Redis, MongoDB */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services: Record<string, ServiceStatus> = {};

    // Backend (self) - we're responding, so up
    services.backend = {
      status: 'up',
      latencyMs: 0,
      message: 'API responding',
    };

    // MongoDB
    try {
      const { result, latencyMs } = await measureLatency(async () => {
        await connectDB();
        if (mongoose.connection.readyState !== 1) {
          throw new Error('Not connected');
        }
        const db = mongoose.connection.db;
        if (!db) throw new Error('Database not initialized');
        await db.admin().command({ ping: 1 });
        return true;
      });
      services.mongodb = {
        status: result ? 'up' : 'down',
        latencyMs,
        message: result ? 'Connected' : 'Connection failed',
      };
    } catch (err) {
      services.mongodb = {
        status: 'down',
        message: err instanceof Error ? err.message : 'Connection failed',
      };
    }

    // Redis
    try {
      const { result, latencyMs } = await measureLatency(redisHealth);
      services.redis = {
        status: result.ok ? 'up' : 'down',
        latencyMs,
        message: result.ok ? 'Connected' : result.message || 'Ping failed',
      };
    } catch (err) {
      services.redis = {
        status: 'down',
        message: err instanceof Error ? err.message : 'Check failed',
      };
    }

    // AI Service (only if configured)
    if (AI_SERVICE_URL) {
      try {
        const { result, latencyMs } = await measureLatency(async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${AI_SERVICE_URL.replace(/\/$/, '')}/health`, {
            signal: controller.signal,
            headers: AI_SERVICE_API_KEY ? { 'X-API-Key': AI_SERVICE_API_KEY } : {},
          });
          clearTimeout(timeout);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { ok?: boolean };
          return data?.ok === true;
        });
        services.aiService = {
          status: result ? 'up' : 'down',
          latencyMs,
          message: result ? 'Responding' : 'Unhealthy or unreachable',
        };
      } catch (err) {
        services.aiService = {
          status: 'down',
          message: err instanceof Error ? err.message : 'Unreachable',
        };
      }
    } else {
      services.aiService = {
        status: 'unknown',
        message: 'AI_SERVICE_URL not configured',
      };
    }

    const allUp = Object.values(services).every((s) => s.status === 'up' || s.status === 'unknown');
    const anyDown = Object.values(services).some((s) => s.status === 'down');

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: anyDown ? 'degraded' : (allUp ? 'healthy' : 'unknown'),
      services,
    });
  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json({ error: 'Failed to fetch system status' }, { status: 500 });
  }
}
