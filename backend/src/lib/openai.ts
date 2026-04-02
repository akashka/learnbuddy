/**
 * OpenAI API client - fallback when Gemini quota is exhausted
 */
import OpenAI, { toFile } from 'openai';
import { AIResponse, AIJsonResponse } from './ai-types';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const TEXT_MODEL = 'gpt-4o-mini';
const VISION_MODEL = 'gpt-4o-mini';

function getImageContent(dataUrl: string): { type: 'image_url'; image_url: { url: string } } | null {
  if (dataUrl.startsWith('data:')) return { type: 'image_url', image_url: { url: dataUrl } };
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return { type: 'image_url', image_url: { url: dataUrl } };
  }
  return null;
}

export async function openaiGenerate(prompt: string, systemInstruction?: string): Promise<AIResponse> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages,
  });
  return {
    text: res.choices[0]?.message?.content ?? '',
    usage: res.usage ? {
      promptTokens: res.usage.prompt_tokens,
      completionTokens: res.usage.completion_tokens,
      totalTokens: res.usage.total_tokens,
      model: TEXT_MODEL,
    } : undefined,
  };
}

export async function openaiGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<AIJsonResponse<T>> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const sys = systemInstruction
    ? `${systemInstruction}\n\nRespond with valid JSON only, no markdown or extra text.`
    : 'Respond with valid JSON only, no markdown or extra text.';
  const fullPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown or extra text.`;
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: sys },
    { role: 'user', content: fullPrompt },
  ];
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages,
    response_format: { type: 'json_object' },
  });
  const text = res.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON from OpenAI: ${text.slice(0, 200)}`);
  return {
    data: JSON.parse(jsonMatch[0]) as T,
    usage: res.usage ? {
      promptTokens: res.usage.prompt_tokens,
      completionTokens: res.usage.completion_tokens,
      totalTokens: res.usage.total_tokens,
      model: TEXT_MODEL,
    } : undefined,
  };
}

export async function openaiGenerateWithImages(
  prompt: string,
  imageUrls: string[]
): Promise<AIResponse> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  content.push({ type: 'text', text: prompt });
  for (const url of imageUrls) {
    const img = getImageContent(url);
    if (img) content.push(img);
  }
  const res = await client.chat.completions.create({
    model: VISION_MODEL,
    messages: [{ role: 'user', content }],
  });
  return {
    text: res.choices[0]?.message?.content ?? '',
    usage: res.usage ? {
      promptTokens: res.usage.prompt_tokens,
      completionTokens: res.usage.completion_tokens,
      totalTokens: res.usage.total_tokens,
      model: VISION_MODEL,
    } : undefined,
  };
}

export async function openaiGenerateWithImageAndAudio(
  prompt: string,
  imageDataUrl: string,
  audioDataUrl?: string | null
): Promise<AIResponse> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  content.push({ type: 'text', text: prompt });
  const img = getImageContent(imageDataUrl);
  if (img) content.push(img);
  if (audioDataUrl?.startsWith('data:')) {
    content.push({ type: 'text', text: '[Audio transcript not available - analyze image only.]' });
  }
  const res = await client.chat.completions.create({
    model: VISION_MODEL,
    messages: [{ role: 'user', content }],
  });
  return {
    text: res.choices[0]?.message?.content ?? '',
    usage: res.usage ? {
      promptTokens: res.usage.prompt_tokens,
      completionTokens: res.usage.completion_tokens,
      totalTokens: res.usage.total_tokens,
      model: VISION_MODEL,
    } : undefined,
  };
}

export async function openaiTranscribeAudio(audioDataUrl: string): Promise<AIResponse> {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const match = audioDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { text: '' };
  const mime = match[1] || 'audio/webm';
  const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'm4a' : 'webm';
  const buffer = Buffer.from(match[2], 'base64');
  const file = await toFile(buffer, `audio.${ext}`, { type: mime });
  const res = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });
  // Whisper doesn't return usage in the same way, but we can set model
  return {
    text: (res as { text?: string }).text?.trim() ?? '',
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      model: 'whisper-1',
    },
  };
}

export function isOpenAIConfigured(): boolean {
  return !!apiKey;
}
