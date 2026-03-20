/**
 * Together AI - Free models. OpenAI-compatible.
 * Models: meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo (vision), Llama-3.2-11B (text)
 * Get key: https://api.together.xyz/settings/api-keys
 */
import OpenAI from 'openai';

const apiKey = process.env.TOGETHER_API_KEY;
const client = apiKey
  ? new OpenAI({ apiKey, baseURL: 'https://api.together.xyz/v1' })
  : null;

const TEXT_MODEL = 'meta-llama/Llama-3.2-3B-Instruct-Turbo';
const VISION_MODEL = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo';

function getImageContent(dataUrl: string): { type: 'image_url'; image_url: { url: string } } | null {
  if (dataUrl.startsWith('data:')) return { type: 'image_url', image_url: { url: dataUrl } };
  if (dataUrl.startsWith('http')) return { type: 'image_url', image_url: { url: dataUrl } };
  return null;
}

export async function togetherGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!client) throw new Error('TOGETHER_API_KEY is not configured');
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages,
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function togetherGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!client) throw new Error('TOGETHER_API_KEY is not configured');
  const fullPrompt = (systemInstruction ? `${systemInstruction}\n\n` : '') + prompt + '\n\nRespond with valid JSON only.';
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: 'user', content: fullPrompt }],
  });
  const text = res.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON from Together: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

export async function togetherGenerateWithImages(prompt: string, imageUrls: string[]): Promise<string> {
  if (!client) throw new Error('TOGETHER_API_KEY is not configured');
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];
  for (const url of imageUrls) {
    const img = getImageContent(url);
    if (img) content.push(img);
  }
  const res = await client.chat.completions.create({
    model: VISION_MODEL,
    messages: [{ role: 'user', content }],
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function togetherGenerateWithImageAndAudio(
  prompt: string,
  imageDataUrl: string,
  _audioDataUrl?: string | null
): Promise<string> {
  return togetherGenerateWithImages(prompt, [imageDataUrl]);
}

export function isTogetherConfigured(): boolean {
  return !!apiKey;
}
