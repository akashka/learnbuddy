/**
 * Shared utilities for AI services
 */
import { isAIConfigured } from '../providers/unified.js';

export async function withGeminiFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isAIConfigured()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error('AI API error:', err);
    return fallback;
  }
}
