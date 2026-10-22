/**
 * Redis client - singleton with graceful degradation.
 * If REDIS_URL is not set or Redis is unavailable, cache operations are no-ops.
 */
import dns from 'dns/promises';
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';
const UNAVAILABLE_COOLDOWN_MS = 5 * 60 * 1000;

let client: Redis | null = null;
let unavailableUntil = 0;
let lastUnavailableLog = 0;

function isClosed(redis: Redis): boolean {
  return redis.status === 'end' || redis.status === 'close';
}

function dropClient(): void {
  if (!client) return;
  const current = client;
  client = null;
  current.removeAllListeners();
  try {
    current.disconnect();
  } catch {
    // Already closed.
  }
}

export function isRedisUnavailable(): boolean {
  return Date.now() < unavailableUntil;
}

/** Log once per cooldown and stop opening new connections to a dead host. */
export function markRedisUnavailable(message: string): void {
  unavailableUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
  dropClient();
  if (Date.now() - lastUnavailableLog < UNAVAILABLE_COOLDOWN_MS) return;
  lastUnavailableLog = Date.now();
  console.warn(`[Redis] ${message}. Cache and background jobs are paused until the host is reachable.`);
}

export async function probeRedisHost(): Promise<boolean> {
  if (!REDIS_URL) return false;
  if (isRedisUnavailable()) return false;
  try {
    await dns.lookup(new URL(REDIS_URL).hostname);
    return true;
  } catch (err) {
    markRedisUnavailable(err instanceof Error ? err.message : 'Redis host lookup failed');
    return false;
  }
}

function isNetworkFailure(message: string): boolean {
  return /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|getaddrinfo|Connection is closed/i.test(message);
}

export async function getRedisClient(): Promise<Redis | null> {
  if (!REDIS_URL || isRedisUnavailable()) return null;
  if (client && !isClosed(client)) return client;
  if (!(await probeRedisHost())) return null;
  dropClient();

  const next = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    lazyConnect: true,
    retryStrategy: () => null,
  });

  next.on('error', (err: Error) => {
    const message = err.message || String(err);
    if (isNetworkFailure(message)) {
      markRedisUnavailable(message);
      return;
    }
    console.warn('[Redis] Error:', message);
  });
  next.on('end', () => {
    if (client === next) client = null;
  });

  try {
    await next.connect();
    client = next;
    return client;
  } catch (err) {
    markRedisUnavailable(err instanceof Error ? err.message : 'Redis connection failed');
    next.removeAllListeners();
    try {
      next.disconnect();
    } catch {
      // Already closed.
    }
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
  if (isRedisUnavailable()) return { ok: false, message: 'Redis host is not reachable' };
  const r = await getRedisClient();
  if (!r) return { ok: false, message: 'Redis not connected' };
  try {
    await r.ping();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ping failed';
    if (isNetworkFailure(message)) markRedisUnavailable(message);
    return { ok: false, message };
  }
}
