/**
 * Unified AI provider - tries multiple providers in smart order.
 * Uses health monitor data (availability, latency) to prefer best-performing providers.
 */
import {
  geminiGenerate,
  geminiGenerateJson,
  geminiGenerateWithImages,
  geminiGenerateWithImageAndAudio,
  geminiTranscribeAudio,
  isGeminiConfigured,
} from './gemini.js';
import {
  groqGenerate,
  groqGenerateJson,
  isGroqConfigured,
} from './groq.js';
import {
  huggingfaceGenerate,
  huggingfaceGenerateJson,
  isHuggingfaceConfigured,
} from './huggingface.js';
import {
  openrouterGenerate,
  openrouterGenerateJson,
  openrouterGenerateWithImages,
  openrouterGenerateWithImageAndAudio,
  isOpenRouterConfigured,
} from './openrouter.js';
import {
  cloudflareGenerate,
  cloudflareGenerateJson,
  isCloudflareConfigured,
} from './cloudflare.js';
import {
  togetherGenerate,
  togetherGenerateJson,
  togetherGenerateWithImages,
  togetherGenerateWithImageAndAudio,
  isTogetherConfigured,
} from './together.js';
import {
  openaiGenerate,
  openaiGenerateJson,
  openaiGenerateWithImages,
  openaiGenerateWithImageAndAudio,
  openaiTranscribeAudio,
  isOpenAIConfigured,
} from './openai.js';
import { getProviderOrderForRequest, recordOutcome } from '../services/smart-selector.js';
import type { ProviderCapability } from '../services/provider-health.js';

function isRetryableError(err: unknown): boolean {
  const obj = err as { status?: number; statusCode?: number; code?: number };
  if (obj?.status === 429 || obj?.statusCode === 429 || obj?.code === 429) return true;
  if (obj?.status === 404 || obj?.statusCode === 404 || obj?.code === 404) return true;
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('insufficient_quota')
  );
}

async function withProviderFallback<T>(
  providers: Array<{ name: string; fn: () => Promise<T> }>,
  capability: ProviderCapability
): Promise<T> {
  let lastError: unknown;
  for (const { name, fn } of providers) {
    const start = Date.now();
    try {
      const result = await fn();
      const latencyMs = Date.now() - start;
      recordOutcome(name, capability, true, latencyMs).catch(() => {});
      return result;
    } catch (err) {
      lastError = err;
      const latencyMs = Date.now() - start;
      recordOutcome(name, capability, false, latencyMs, err instanceof Error ? err.message : String(err)).catch(() => {});
      if (isRetryableError(err)) {
        console.warn(`[AI] ${name} failed, trying next provider...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/** Sort providers by smart order (best performing first). */
function sortByOrder<T extends { name: string }>(items: T[], order: string[]): T[] {
  const orderMap = new Map(order.map((n, i) => [n, i]));
  return [...items].sort((a, b) => (orderMap.get(a.name) ?? 999) - (orderMap.get(b.name) ?? 999));
}

export async function aiGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  const providers: Array<{ name: string; fn: () => Promise<string> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiGenerate(prompt, systemInstruction) });
  if (isGroqConfigured()) providers.push({ name: 'Groq', fn: () => groqGenerate(prompt, systemInstruction) });
  if (isHuggingfaceConfigured()) providers.push({ name: 'HuggingFace', fn: () => huggingfaceGenerate(prompt, systemInstruction) });
  if (isOpenRouterConfigured()) providers.push({ name: 'OpenRouter', fn: () => openrouterGenerate(prompt, systemInstruction) });
  if (isCloudflareConfigured()) providers.push({ name: 'Cloudflare', fn: () => cloudflareGenerate(prompt, systemInstruction) });
  if (isTogetherConfigured()) providers.push({ name: 'Together', fn: () => togetherGenerate(prompt, systemInstruction) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiGenerate(prompt, systemInstruction) });
  if (providers.length === 0) {
    throw new Error('No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, HF_TOKEN, OPENROUTER_API_KEY, CLOUDFLARE_*, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }
  const order = await getProviderOrderForRequest('text');
  const sorted = sortByOrder(providers, order);
  return withProviderFallback(sorted, 'text');
}

export async function aiGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const providers: Array<{ name: string; fn: () => Promise<T> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiGenerateJson<T>(prompt, systemInstruction) });
  if (isGroqConfigured()) providers.push({ name: 'Groq', fn: () => groqGenerateJson<T>(prompt, systemInstruction) });
  if (isHuggingfaceConfigured()) providers.push({ name: 'HuggingFace', fn: () => huggingfaceGenerateJson<T>(prompt, systemInstruction) });
  if (isOpenRouterConfigured()) providers.push({ name: 'OpenRouter', fn: () => openrouterGenerateJson<T>(prompt, systemInstruction) });
  if (isCloudflareConfigured()) providers.push({ name: 'Cloudflare', fn: () => cloudflareGenerateJson<T>(prompt, systemInstruction) });
  if (isTogetherConfigured()) providers.push({ name: 'Together', fn: () => togetherGenerateJson<T>(prompt, systemInstruction) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiGenerateJson<T>(prompt, systemInstruction) });
  if (providers.length === 0) {
    throw new Error('No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, HF_TOKEN, OPENROUTER_API_KEY, CLOUDFLARE_*, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }
  const order = await getProviderOrderForRequest('text');
  const sorted = sortByOrder(providers, order);
  return withProviderFallback(sorted, 'text');
}

export async function aiGenerateWithImages(prompt: string, imageUrls: string[]): Promise<string> {
  const providers: Array<{ name: string; fn: () => Promise<string> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiGenerateWithImages(prompt, imageUrls) });
  if (isOpenRouterConfigured()) providers.push({ name: 'OpenRouter', fn: () => openrouterGenerateWithImages(prompt, imageUrls) });
  if (isTogetherConfigured()) providers.push({ name: 'Together', fn: () => togetherGenerateWithImages(prompt, imageUrls) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiGenerateWithImages(prompt, imageUrls) });
  if (providers.length === 0) {
    throw new Error('No AI provider with vision configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }
  const order = await getProviderOrderForRequest('vision');
  const sorted = sortByOrder(providers, order);
  return withProviderFallback(sorted, 'vision');
}

export async function aiGenerateWithImageAndAudio(
  prompt: string,
  imageDataUrl: string,
  audioDataUrl?: string | null
): Promise<string> {
  const providers: Array<{ name: string; fn: () => Promise<string> }> = [];
  if (isGeminiConfigured()) providers.push({
    name: 'Gemini',
    fn: () => geminiGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl),
  });
  if (isOpenRouterConfigured()) providers.push({
    name: 'OpenRouter',
    fn: () => openrouterGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl),
  });
  if (isTogetherConfigured()) providers.push({
    name: 'Together',
    fn: () => togetherGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl),
  });
  if (isOpenAIConfigured()) providers.push({
    name: 'OpenAI',
    fn: () => openaiGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl),
  });
  if (providers.length === 0) {
    throw new Error('No AI provider with vision configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }
  const order = await getProviderOrderForRequest('vision');
  const sorted = sortByOrder(providers, order);
  return withProviderFallback(sorted, 'vision');
}

export async function aiTranscribeAudio(audioDataUrl: string): Promise<string> {
  const providers: Array<{ name: string; fn: () => Promise<string> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiTranscribeAudio(audioDataUrl) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiTranscribeAudio(audioDataUrl) });
  if (providers.length === 0) return '';
  try {
    const order = await getProviderOrderForRequest('audio');
    const sorted = sortByOrder(providers, order);
    return await withProviderFallback(sorted, 'audio');
  } catch {
    return '';
  }
}

export function isAIConfigured(): boolean {
  return (
    isGeminiConfigured() ||
    isGroqConfigured() ||
    isHuggingfaceConfigured() ||
    isOpenRouterConfigured() ||
    isCloudflareConfigured() ||
    isTogetherConfigured() ||
    isOpenAIConfigured()
  );
}
