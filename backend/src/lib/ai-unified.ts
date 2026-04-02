/**
 * Unified AI provider - tries multiple providers in order
 * Gemini → Groq → HuggingFace → OpenRouter → Cloudflare → Together → OpenAI
 */
import {
  geminiGenerate,
  geminiGenerateJson,
  geminiGenerateWithImages,
  geminiGenerateWithImageAndAudio,
  geminiTranscribeAudio,
  isGeminiConfigured,
} from '@/lib/gemini';
import { AIResponse, AIJsonResponse } from './ai-types';
import {
  groqGenerate,
  groqGenerateJson,
  isGroqConfigured,
} from '@/lib/groq';
import {
  huggingfaceGenerate,
  huggingfaceGenerateJson,
  isHuggingfaceConfigured,
} from '@/lib/huggingface';
import {
  openrouterGenerate,
  openrouterGenerateJson,
  openrouterGenerateWithImages,
  openrouterGenerateWithImageAndAudio,
  isOpenRouterConfigured,
} from '@/lib/openrouter';
import {
  cloudflareGenerate,
  cloudflareGenerateJson,
  isCloudflareConfigured,
} from '@/lib/cloudflare';
import {
  togetherGenerate,
  togetherGenerateJson,
  togetherGenerateWithImages,
  togetherGenerateWithImageAndAudio,
  isTogetherConfigured,
} from '@/lib/together';
import {
  openaiGenerate,
  openaiGenerateJson,
  openaiGenerateWithImages,
  openaiGenerateWithImageAndAudio,
  openaiTranscribeAudio,
  isOpenAIConfigured,
} from '@/lib/openai';
import { wrapWithCache, CacheKeys, CacheTTL } from '@/lib/cache';
import { createHash } from 'crypto';

function getCacheKey(prompt: string, systemInstruction?: string, extra?: any): string {
  const payload = JSON.stringify({ prompt, systemInstruction, ...extra });
  return createHash('sha256').update(payload).digest('hex');
}

async function withRetry<T>(
  fn: () => Promise<T>,
  name: string,
  maxRetries = 2
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isRetryableError(err)) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[AI] ${name} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, err instanceof Error ? err.message : err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

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
  providers: Array<{ name: string; fn: () => Promise<T> }>
): Promise<T> {
  let lastError: unknown;
  for (const { name, fn } of providers) {
    try {
      return await withRetry(fn, name);
    } catch (err) {
      lastError = err;
      if (isRetryableError(err)) {
        console.warn(`[AI] ${name} exhausted retries or failed, trying next provider...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function aiGenerate(prompt: string, systemInstruction?: string): Promise<AIResponse> {
  const providers: Array<{ name: string; fn: () => Promise<AIResponse> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiGenerate(prompt, systemInstruction) });
  if (isGroqConfigured()) providers.push({ name: 'Groq', fn: async () => ({ text: await groqGenerate(prompt, systemInstruction) }) });
  if (isHuggingfaceConfigured()) providers.push({ name: 'HuggingFace', fn: async () => ({ text: await huggingfaceGenerate(prompt, systemInstruction) }) });
  if (isOpenRouterConfigured()) providers.push({ name: 'OpenRouter', fn: async () => ({ text: await openrouterGenerate(prompt, systemInstruction) }) });
  if (isCloudflareConfigured()) providers.push({ name: 'Cloudflare', fn: async () => ({ text: await cloudflareGenerate(prompt, systemInstruction) }) });
  if (isTogetherConfigured()) providers.push({ name: 'Together', fn: async () => ({ text: await togetherGenerate(prompt, systemInstruction) }) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiGenerate(prompt, systemInstruction) });
  
  if (providers.length === 0) {
    throw new Error('No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, HF_TOKEN, OPENROUTER_API_KEY, CLOUDFLARE_*, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }

  const cacheKey = getCacheKey(prompt, systemInstruction);
  return wrapWithCache(
    CacheKeys.aiResponse(cacheKey),
    CacheTTL.aiResponse,
    () => withProviderFallback(providers)
  );
}

export async function aiGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<AIJsonResponse<T>> {
  const providers: Array<{ name: string; fn: () => Promise<AIJsonResponse<T>> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiGenerateJson<T>(prompt, systemInstruction) });
  if (isGroqConfigured()) providers.push({ name: 'Groq', fn: async () => ({ data: await groqGenerateJson<T>(prompt, systemInstruction) }) });
  if (isHuggingfaceConfigured()) providers.push({ name: 'HuggingFace', fn: async () => ({ data: await huggingfaceGenerateJson<T>(prompt, systemInstruction) }) });
  if (isOpenRouterConfigured()) providers.push({ name: 'OpenRouter', fn: async () => ({ data: await openrouterGenerateJson<T>(prompt, systemInstruction) }) });
  if (isCloudflareConfigured()) providers.push({ name: 'Cloudflare', fn: async () => ({ data: await cloudflareGenerateJson<T>(prompt, systemInstruction) }) });
  if (isTogetherConfigured()) providers.push({ name: 'Together', fn: async () => ({ data: await togetherGenerateJson<T>(prompt, systemInstruction) }) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiGenerateJson<T>(prompt, systemInstruction) });
  
  if (providers.length === 0) {
    throw new Error('No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, HF_TOKEN, OPENROUTER_API_KEY, CLOUDFLARE_*, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }

  const cacheKey = getCacheKey(prompt, systemInstruction, { json: true });
  return wrapWithCache(
    CacheKeys.aiResponse(cacheKey),
    CacheTTL.aiResponse,
    () => withProviderFallback(providers)
  );
}

export async function aiGenerateWithImages(prompt: string, imageUrls: string[]): Promise<AIResponse> {
  const providers: Array<{ name: string; fn: () => Promise<AIResponse> }> = [];
  if (isGeminiConfigured()) providers.push({ name: 'Gemini', fn: () => geminiGenerateWithImages(prompt, imageUrls) });
  if (isOpenRouterConfigured()) providers.push({ name: 'OpenRouter', fn: async () => ({ text: await openrouterGenerateWithImages(prompt, imageUrls) }) });
  if (isTogetherConfigured()) providers.push({ name: 'Together', fn: async () => ({ text: await togetherGenerateWithImages(prompt, imageUrls) }) });
  if (isOpenAIConfigured()) providers.push({ name: 'OpenAI', fn: () => openaiGenerateWithImages(prompt, imageUrls) });
  if (providers.length === 0) {
    throw new Error('No AI provider with vision configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }

  const cacheKey = getCacheKey(prompt, undefined, { imageUrls });
  return wrapWithCache(
    CacheKeys.aiResponse(cacheKey),
    CacheTTL.aiResponse,
    () => withProviderFallback(providers)
  );
}

export async function aiGenerateWithImageAndAudio(
  prompt: string,
  imageDataUrl: string,
  audioDataUrl?: string | null
): Promise<AIResponse> {
  const providers: Array<{ name: string; fn: () => Promise<AIResponse> }> = [];
  if (isGeminiConfigured()) {
    providers.push({
      name: 'Gemini',
      fn: () => geminiGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl),
    });
  }
  if (isOpenRouterConfigured()) {
    providers.push({
      name: 'OpenRouter',
      fn: async () => ({ text: await openrouterGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl) }),
    });
  }
  if (isTogetherConfigured()) {
    providers.push({
      name: 'Together',
      fn: async () => ({ text: await togetherGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl) }),
    });
  }
  if (isOpenAIConfigured()) {
    providers.push({
      name: 'OpenAI',
      fn: () => openaiGenerateWithImageAndAudio(prompt, imageDataUrl, audioDataUrl),
    });
  }
  if (providers.length === 0) {
    throw new Error('No AI provider with vision configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY.');
  }

  const cacheKey = getCacheKey(prompt, undefined, { imageDataUrl, audioDataUrl });
  return wrapWithCache(
    CacheKeys.aiResponse(cacheKey),
    CacheTTL.aiResponse,
    () => withProviderFallback(providers)
  );
}

export async function aiTranscribeAudio(audioDataUrl: string): Promise<AIResponse> {
  const providers: Array<{ name: string; fn: () => Promise<AIResponse> }> = [];
  if (isGeminiConfigured()) {
    providers.push({ name: 'Gemini', fn: () => geminiTranscribeAudio(audioDataUrl) });
  }
  if (isOpenAIConfigured()) {
    providers.push({ name: 'OpenAI', fn: () => openaiTranscribeAudio(audioDataUrl) });
  }
  if (providers.length === 0) return { text: '' };
  
  const cacheKey = getCacheKey('transcribe', undefined, { audioDataUrl });
  return wrapWithCache(
    CacheKeys.aiResponse(cacheKey),
    CacheTTL.aiResponse,
    () => withProviderFallback(providers)
  ).catch(() => ({ text: '' }));
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
