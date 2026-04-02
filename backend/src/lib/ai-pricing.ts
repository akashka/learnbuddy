/**
 * AI pricing utility - maps model IDs to costs (USD per 1M tokens)
 * Prices as of March 2026
 */

export interface ModelPricing {
  input1m: number;
  output1m: number;
}

const PRICING_MAP: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { input1m: 2.50, output1m: 10.00 },
  'gpt-4o-mini': { input1m: 0.15, output1m: 0.60 },
  'gpt-3.5-turbo': { input1m: 0.50, output1m: 1.50 },
  'whisper-1': { input1m: 0, output1m: 0 }, // Whisper is per minute, but we'll use 0 or handle separately

  // Gemini (Google)
  'gemini-2.5-pro': { input1m: 1.25, output1m: 5.00 },
  'gemini-2.5-flash': { input1m: 0.10, output1m: 0.40 },
  'gemini-2.0-flash': { input1m: 0.10, output1m: 0.40 },
  'gemini-2.0-flash-lite': { input1m: 0.075, output1m: 0.30 },
  'gemini-2.5-flash-lite': { input1m: 0.075, output1m: 0.30 },

  // Default fallback (low cost)
  'default': { input1m: 0.10, output1m: 0.40 },
};

/**
 * Calculate cost for an AI operation
 * @param modelId The model identifier
 * @param promptTokens Number of input tokens
 * @param completionTokens Number of output tokens
 * @returns Cost in USD
 */
export function calculateAICost(
  modelId: string,
  promptTokens: number = 0,
  completionTokens: number = 0
): number {
  let pricing = PRICING_MAP[modelId];

  // Fuzzy match if exact match not found
  if (!pricing) {
    const key = Object.keys(PRICING_MAP).find(k => modelId.includes(k));
    pricing = key ? PRICING_MAP[key] : PRICING_MAP['default'];
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input1m;
  const outputCost = (completionTokens / 1_000_000) * pricing.output1m;

  return Number((inputCost + outputCost).toFixed(6));
}
