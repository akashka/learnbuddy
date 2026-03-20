/**
 * Smart Model Selector
 * Determines which AI provider to use based on:
 * - Request type (text, vision, audio)
 * - Current provider health (availability, latency, success rate)
 */
import {
  getBestProviderOrder,
  recordProviderOutcome,
  type ProviderCapability,
} from './provider-health.js';

/**
 * Get the ordered list of provider names for the given capability.
 * Order is based on health data (success rate, latency). Unified provider filters to configured only.
 */
export async function getProviderOrderForRequest(capability: ProviderCapability): Promise<string[]> {
  return getBestProviderOrder(capability);
}

/**
 * Record the outcome of a provider call for future smart selection.
 */
export async function recordOutcome(
  name: string,
  capability: ProviderCapability,
  success: boolean,
  latencyMs: number,
  error?: string
): Promise<void> {
  await recordProviderOutcome(name, capability, success, latencyMs, error);
}
