/**
 * Cloudflare Workers AI - 10,000 free Neurons/day.
 * Text only (no vision). Get: Account ID + API token.
 * Docs: https://developers.cloudflare.com/workers-ai/
 */
import OpenAI from 'openai';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiKey = process.env.CLOUDFLARE_API_TOKEN;
const client = accountId && apiKey
  ? new OpenAI({
      apiKey,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
    })
  : null;

const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export async function cloudflareGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!client) throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are not configured');
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages,
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function cloudflareGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!client) throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are not configured');
  const fullPrompt = (systemInstruction ? `${systemInstruction}\n\n` : '') + prompt + '\n\nRespond with valid JSON only, no markdown.';
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'user', content: fullPrompt },
  ];
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages,
  });
  const text = res.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON from Cloudflare: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

export function isCloudflareConfigured(): boolean {
  return !!accountId && !!apiKey;
}
