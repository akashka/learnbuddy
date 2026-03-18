/**
 * Cache layer for AI outputs. Graceful degradation: if Redis unavailable, always runs fn.
 */
import { createHash } from 'crypto';
import { redisGet, redisSet } from './redis.js';

const CACHE_PREFIX = 'ai:';

export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const fullKey = CACHE_PREFIX + key;
  const cached = await redisGet(fullKey);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Invalid JSON, fall through to fn
    }
  }

  const result = await fn();
  const serialized = JSON.stringify(result);
  await redisSet(fullKey, serialized, ttlSeconds);
  return result;
}

export function hashKey(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 24);
}

/** TTL: 24 hours for AI outputs */
export const AI_CACHE_TTL = 86400;
