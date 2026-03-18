/**
 * Shared utilities for AI services
 */
import { isGeminiConfigured } from '../providers/gemini.js';

export async function withGeminiFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isGeminiConfigured()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error('Gemini API error:', err);
    return fallback;
  }
}
