/**
 * OpenRouter - Single API for many models. Free router: openrouter/free.
 * Get key: https://openrouter.ai/keys
 */
import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const client = apiKey ? new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' }) : null;

const TEXT_MODEL = 'openrouter/free';

function getImageContent(dataUrl: string): { type: 'image_url'; image_url: { url: string } } | null {
  if (dataUrl.startsWith('data:')) return { type: 'image_url', image_url: { url: dataUrl } };
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return { type: 'image_url', image_url: { url: dataUrl } };
  }
  return null;
}

export async function openrouterGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!client) throw new Error('OPENROUTER_API_KEY is not configured');
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });
  const res = await client.chat.completions.create({ model: TEXT_MODEL, messages });
  return res.choices[0]?.message?.content ?? '';
}

export async function openrouterGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!client) throw new Error('OPENROUTER_API_KEY is not configured');
  const fullPrompt = (systemInstruction ? `${systemInstruction}\n\n` : '') + prompt + '\n\nRespond with valid JSON only, no markdown.';
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'user', content: fullPrompt }];
  const res = await client.chat.completions.create({ model: TEXT_MODEL, messages });
  const text = res.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON from OpenRouter: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

export async function openrouterGenerateWithImages(prompt: string, imageUrls: string[]): Promise<string> {
  if (!client) throw new Error('OPENROUTER_API_KEY is not configured');
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  content.push({ type: 'text', text: prompt });
  for (const url of imageUrls) {
    const img = getImageContent(url);
    if (img) content.push(img);
  }
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: 'user', content }],
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function openrouterGenerateWithImageAndAudio(
  prompt: string,
  imageDataUrl: string,
  _audioDataUrl?: string | null
): Promise<string> {
  if (!client) throw new Error('OPENROUTER_API_KEY is not configured');
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  content.push({ type: 'text', text: prompt });
  const img = getImageContent(imageDataUrl);
  if (img) content.push(img);
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: 'user', content }],
  });
  return res.choices[0]?.message?.content ?? '';
}

export function isOpenRouterConfigured(): boolean {
  return !!apiKey;
}
