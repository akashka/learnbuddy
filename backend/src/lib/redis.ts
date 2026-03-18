/**
 * Redis client - singleton with graceful degradation.
 * If REDIS_URL is not set or Redis is unavailable, cache operations are no-ops.
 */
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';

let client: Redis | null = null;

export async function getRedisClient(): Promise<Redis | null> {
  if (!REDIS_URL) return null;
  if (client) return client;

  try {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    client.on('error', (err: Error) => {
      console.warn('[Redis] Error:', err.message);
    });

    return client;
  } catch (err) {
    console.warn('[Redis] Failed to connect:', err instanceof Error ? err.message : err);
    client = null;
    return null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const r = await getRedisClient();
  if (!r) return null;
  try {
    return await r.get(key);
  } catch {
    return null;
  }
}

export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  const r = await getRedisClient();
  if (!r) return false;
  try {
    if (ttlSeconds) {
      await r.setex(key, ttlSeconds, value);
    } else {
      await r.set(key, value);
    }
    return true;
  } catch {
    return false;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  const r = await getRedisClient();
  if (!r) return false;
  try {
    await r.del(key);
    return true;
  } catch {
    return false;
  }
}

export async function redisDelPattern(pattern: string): Promise<number> {
  const r = await getRedisClient();
  if (!r) return 0;
  try {
    const keys = await r.keys(pattern);
    if (keys.length === 0) return 0;
    await r.del(...keys);
    return keys.length;
  } catch {
    return 0;
  }
}

export async function redisHealth(): Promise<{ ok: boolean; message?: string }> {
  if (!REDIS_URL) return { ok: false, message: 'REDIS_URL not configured' };
  const r = await getRedisClient();
  if (!r) return { ok: false, message: 'Redis not connected' };
  try {
    await r.ping();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Ping failed' };
  }
}
