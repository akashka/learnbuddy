/**
 * Token blacklist for logout - stores revoked tokens in Redis with TTL = remaining token expiry.
 * When Redis is unavailable, blacklist checks fail open (allow request) to avoid blocking users.
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { redisSet, redisGet } from './redis.js';

const BLACKLIST_PREFIX = 'token_blacklist:';

function tokenKey(token: string): string {
  return BLACKLIST_PREFIX + crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Adds a token to the blacklist. TTL is set to the token's remaining expiry.
 * Returns true if added successfully, false if Redis unavailable.
 */
export async function addToBlacklist(token: string): Promise<boolean> {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const ttlSeconds = Math.max(0, decoded.exp - now);
    if (ttlSeconds <= 0) return true; // Token already expired, no need to blacklist

    return redisSet(tokenKey(token), '1', ttlSeconds);
  } catch {
    return false;
  }
}

/**
 * Returns true if the token is blacklisted (revoked).
 * Fails open: returns false if Redis is unavailable.
 */
export async function isBlacklisted(token: string): Promise<boolean> {
  const value = await redisGet(tokenKey(token));
  return value !== null;
}
