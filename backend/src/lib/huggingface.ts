/**
 * Hugging Face Inference - OpenAI-compatible API.
 * Free tier: ~300 req/hour, $0.10/month credits.
 * Get token: https://huggingface.co/settings/tokens
 */
import OpenAI from 'openai';

const apiKey = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_TOKEN;
const client = apiKey
  ? new OpenAI({ apiKey, baseURL: 'https://router.huggingface.co/v1' })
  : null;

const TEXT_MODEL = process.env.HF_MODEL || 'meta-llama/Llama-3.3-70B-Instruct:groq';

export async function huggingfaceGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!client) throw new Error('HF_TOKEN or HUGGINGFACE_TOKEN is not configured');
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });
  const res = await client.chat.completions.create({ model: TEXT_MODEL, messages });
  return res.choices[0]?.message?.content ?? '';
}

export async function huggingfaceGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!client) throw new Error('HF_TOKEN or HUGGINGFACE_TOKEN is not configured');
  const fullPrompt = (systemInstruction ? `${systemInstruction}\n\n` : '') + prompt + '\n\nRespond with valid JSON only, no markdown.';
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'user', content: fullPrompt }];
  const res = await client.chat.completions.create({ model: TEXT_MODEL, messages });
  const text = res.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON from HuggingFace: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

export function isHuggingfaceConfigured(): boolean {
  return !!apiKey;
}
