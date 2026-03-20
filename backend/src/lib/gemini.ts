/**
 * Gemini API client for AI features
 * Includes fallback to alternative models on rate limit (429) errors
 */
import { GoogleGenAI, createPartFromText, createPartFromBase64 } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Higher capability first; when rate limit exhausted, fall back to lower models (often more quota)
// Note: gemini-1.5-* deprecated Apr 2025 - use 2.x only
const MODEL_FALLBACKS = [
  'gemini-2.5-pro',        // highest capability, 5 RPM
  'gemini-2.5-flash',      // 10 RPM
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite', // 15 RPM, 1000 RPD - most generous
];

function isRetryableError(err: unknown): boolean {
  const obj = err as { status?: number; statusCode?: number; code?: number };
  // Rate limit (429) or model not found (404) - try next model
  if (obj?.status === 429 || obj?.statusCode === 429 || obj?.code === 429) {
    return true;
  }
  if (obj?.status === 404 || obj?.statusCode === 404 || obj?.code === 404) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('resource exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('ratelimit') ||
    lower.includes('quota exceeded') ||
    lower.includes('too many requests') ||
    lower.includes('not found') ||
    lower.includes('404')
  );
}

async function withModelFallback<T>(
  fn: (model: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (const model of MODEL_FALLBACKS) {
    try {
      return await fn(model);
    } catch (err) {
      lastError = err;
      if (isRetryableError(err)) {
        console.warn(`[Gemini] Error on ${model}, trying next model...`); // eslint-disable-line no-console
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function geminiGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
  return withModelFallback(async (model) => {
    const response = await ai!.models.generateContent({
      model,
      contents: fullPrompt,
    });
    return response.text ?? '';
  });
}

export async function geminiGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n${prompt}\n\nRespond with valid JSON only, no markdown or extra text.`
    : `${prompt}\n\nRespond with valid JSON only, no markdown or extra text.`;
  const text = await withModelFallback(async (model) => {
    const response = await ai!.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return response.text ?? '';
  });
  let cleaned = text.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Invalid JSON response from AI: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (parseErr) {
    throw new Error(`Invalid JSON response from AI: ${text.slice(0, 200)}`);
  }
}

/** Extract base64 from data URL or fetch from http(s) URL */
async function getImageBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) return { mimeType: match[1], data: match[2] };
    return null;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      const mime = res.headers.get('content-type') || 'image/jpeg';
      return { mimeType: mime, data: base64 };
    } catch {
      return null;
    }
  }
  return null;
}

export async function geminiGenerateWithImages(
  prompt: string,
  imageUrls: string[]
): Promise<string> {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured');
  const parts = [createPartFromText(prompt)];
  for (const url of imageUrls) {
    const img = await getImageBase64(url);
    if (img) parts.push(createPartFromBase64(img.data, img.mimeType));
  }
  return withModelFallback(async (model) => {
    const response = await ai!.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
    });
    return response.text ?? '';
  });
}

/** Extract base64 from data URL for audio */
function getAudioBase64(dataUrl: string): { data: string; mimeType: string } | null {
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) return { mimeType: match[1], data: match[2] };
  }
  return null;
}

/** Generate with image + optional audio for exam monitoring */
export async function geminiGenerateWithImageAndAudio(
  prompt: string,
  imageDataUrl: string,
  audioDataUrl?: string | null
): Promise<string> {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured');
  const parts = [createPartFromText(prompt)];
  const img = await getImageBase64(imageDataUrl);
  if (img) parts.push(createPartFromBase64(img.data, img.mimeType));
  if (audioDataUrl) {
    const audio = getAudioBase64(audioDataUrl);
    if (audio) parts.push(createPartFromBase64(audio.data, audio.mimeType));
  }
  return withModelFallback(async (model) => {
    const response = await ai!.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
    });
    return response.text ?? '';
  });
}

/** Transcribe audio to text using Gemini (speech-to-text) */
export async function geminiTranscribeAudio(audioDataUrl: string): Promise<string> {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured');
  const audio = getAudioBase64(audioDataUrl);
  if (!audio) return '';
  const parts = [
    createPartFromText(
      'Transcribe this audio exactly. Return only the spoken words as text. If the audio is silent, unclear, or contains only noise, return an empty string. Use proper punctuation and capitalization. Support English and Indian languages (Hindi, etc.) if spoken.'
    ),
    createPartFromBase64(audio.data, audio.mimeType),
  ];
  return withModelFallback(async (model) => {
    const response = await ai!.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
    });
    return (response.text ?? '').trim();
  });
}

export function isGeminiConfigured(): boolean {
  return !!apiKey;
}
