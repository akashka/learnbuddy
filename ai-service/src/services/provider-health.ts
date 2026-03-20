/**
 * AI Provider Health Monitor
 * Tracks availability, latency, and success rate per provider.
 * Used by smart-selector to choose the best provider for each request.
 */
import { redisGet, redisSet, getRedisClient } from '../lib/redis.js';

const HEALTH_KEY_PREFIX = 'ai:provider:health:';
const HEALTH_TTL = 60 * 10; // 10 minutes - health expires if not updated

export type ProviderCapability = 'text' | 'vision' | 'audio';

export interface ProviderHealth {
  name: string;
  capability: ProviderCapability;
  success: boolean;
  latencyMs: number;
  lastCheck: string;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

const DEFAULT_ORDER: Record<ProviderCapability, string[]> = {
  text: ['Gemini', 'Groq', 'HuggingFace', 'OpenRouter', 'Cloudflare', 'Together', 'OpenAI'],
  vision: ['Gemini', 'OpenRouter', 'Together', 'OpenAI'],
  audio: ['Gemini', 'OpenAI'],
};

function healthKey(name: string, capability: ProviderCapability): string {
  return `${HEALTH_KEY_PREFIX}${name}:${capability}`;
}

export async function recordProviderOutcome(
  name: string,
  capability: ProviderCapability,
  success: boolean,
  latencyMs: number,
  lastError?: string
): Promise<void> {
  const key = healthKey(name, capability);
  const existing = await redisGet(key);
  let data: ProviderHealth;
  if (existing) {
    try {
      data = JSON.parse(existing) as ProviderHealth;
    } catch {
      data = { name, capability, success, latencyMs, lastCheck: new Date().toISOString(), successCount: 0, failureCount: 0 };
    }
  } else {
    data = { name, capability, success, latencyMs, lastCheck: new Date().toISOString(), successCount: 0, failureCount: 0 };
  }
  data.success = success;
  data.latencyMs = latencyMs;
  data.lastCheck = new Date().toISOString();
  data.lastError = lastError;
  if (success) data.successCount += 1;
  else data.failureCount += 1;
  await redisSet(key, JSON.stringify(data), HEALTH_TTL);
}

export async function getProviderHealth(name: string, capability: ProviderCapability): Promise<ProviderHealth | null> {
  const raw = await redisGet(healthKey(name, capability));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProviderHealth;
  } catch {
    return null;
  }
}

export async function getAllProviderHealth(capability: ProviderCapability): Promise<ProviderHealth[]> {
  const redis = await getRedisClient();
  if (!redis) return [];
  const keys = await redis.keys(`${HEALTH_KEY_PREFIX}*:${capability}`);
  const results: ProviderHealth[] = [];
  for (const key of keys) {
    const raw = await redis.get(key);
    if (raw) {
      try {
        results.push(JSON.parse(raw) as ProviderHealth);
      } catch {
        /* skip */
      }
    }
  }
  return results;
}

/**
 * Compute a score for provider selection. Higher = prefer first.
 * - Recent success: +100
 * - Low latency: up to +50 (faster = higher)
 * - Recent failure: -50 per consecutive failure
 */
function scoreProvider(h: ProviderHealth | null, defaultOrder: string[]): number {
  if (!h) return 0;
  const baseOrder = defaultOrder.indexOf(h.name);
  const orderBonus = Math.max(0, 100 - baseOrder * 10); // prefer earlier in default order
  if (!h.success) {
    const failurePenalty = Math.min(h.failureCount * 30, 150);
    return orderBonus - failurePenalty - 100;
  }
  const latencyBonus = Math.max(0, 50 - Math.floor(h.latencyMs / 100)); // faster = better
  const successBonus = Math.min(h.successCount * 5, 50);
  return orderBonus + latencyBonus + successBonus;
}

/**
 * Get the best provider order for the given capability.
 * Uses health data when available; falls back to default order.
 */
export async function getBestProviderOrder(capability: ProviderCapability): Promise<string[]> {
  const defaultOrder = DEFAULT_ORDER[capability];
  const all = await getAllProviderHealth(capability);
  if (all.length === 0) return defaultOrder;

  const scores = new Map<string, number>();
  for (const name of defaultOrder) {
    const h = all.find((x) => x.name === name) ?? null;
    scores.set(name, scoreProvider(h, defaultOrder));
  }
  return [...defaultOrder].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
}

/**
 * Run a quick probe on a provider. Returns { success, latencyMs, error }.
 */
export async function probeProvider(
  name: string,
  capability: ProviderCapability,
  probeFn: () => Promise<unknown>
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await probeFn();
    const latencyMs = Date.now() - start;
    await recordProviderOutcome(name, capability, true, latencyMs);
    return { success: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    await recordProviderOutcome(name, capability, false, latencyMs, error);
    return { success: false, latencyMs, error };
  }
}
