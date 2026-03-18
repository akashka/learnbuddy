/**
 * Cache layer using Redis. Graceful degradation: if Redis unavailable, always runs fn.
 */
import { redisGet, redisSet, redisDel, redisDelPattern } from './redis.js';

const CACHE_PREFIX = 'tp:';

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

export async function cacheInvalidate(key: string): Promise<void> {
  await redisDel(CACHE_PREFIX + key);
}

export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  return redisDelPattern(CACHE_PREFIX + pattern);
}

/** Cache keys and TTLs */
export const CacheKeys = {
  masters: (type?: string) => `masters:${type || 'all'}`,
  boardClassSubjects: (board?: string, classLevel?: string) =>
    `bcs:${board || ''}:${classLevel || ''}`,
  marketplace: (queryString: string) => `marketplace:${queryString}`,
  unreadCount: (userId: string) => `unread:${userId}`,
} as const;

export const CacheTTL = {
  masters: 3600, // 1 hour
  boardClassSubjects: 3600, // 1 hour
  marketplace: 300, // 5 min
  unreadCount: 60, // 1 min
} as const;
