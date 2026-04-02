import { redisGet, redisSet, redisDel, redisDelPattern } from './redis.js';

/** Cache TTL in seconds */
export const CacheTTL = {
  masters: 3600, // 1 hour
  boardClassSubjects: 3600,
  marketplace: 600, // 10 minutes
  unreadCount: 300, // 5 minutes
  websiteSettings: 3600,
  aiResponse: 21600, // 6 hours
};

/** Standardized cache keys */
export const CacheKeys = {
  masters: (type?: string) => `masters:${type || 'all'}`,
  boardClassSubjects: (board?: string, classLevel?: string) => `board_class_subjects:${board || 'all'}:${classLevel || 'all'}`,
  marketplace: (queryString: string) => `marketplace:${queryString}`,
  unreadCount: (userId: string) => `unread_count:${userId}`,
  websiteSettings: (lang?: string) => `website_settings:${lang || 'en'}`,
  aiResponse: (hash: string) => `ai_response:${hash}`,
};

/**
 * Generic get-or-set pattern for Redis caching.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redisGet(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch (err) {
      console.error(`[Cache] Error parsing key ${key}:`, err);
    }
  }

  const data = await fetchFn();
  if (data !== undefined && data !== null) {
    await redisSet(key, JSON.stringify(data), ttlSeconds);
  }
  return data;
}

/**
 * Invalidate a specific cache key.
 */
export async function cacheInvalidate(key: string): Promise<void> {
  await redisDel(key);
}

/**
 * Invalidate cache keys matching a glob pattern (e.g., 'masters:*').
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  await redisDelPattern(pattern);
}

/**
 * Alias for cacheGetOrSet to allow generic usage.
 */
export const wrapWithCache = cacheGetOrSet;
