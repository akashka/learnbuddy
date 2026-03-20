/**
 * Groq API - Free tier, ultra-fast. OpenAI-compatible.
 */
import OpenAI from 'openai';

const apiKey = process.env.GROQ_API_KEY;
const client = apiKey
  ? new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })
  : null;

const TEXT_MODEL = 'llama-3.3-70b-versatile';

export async function groqGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!client) throw new Error('GROQ_API_KEY is not configured');
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });
  const res = await client.chat.completions.create({ model: TEXT_MODEL, messages });
  return res.choices[0]?.message?.content ?? '';
}

export async function groqGenerateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!client) throw new Error('GROQ_API_KEY is not configured');
  const fullPrompt = (systemInstruction ? `${systemInstruction}\n\n` : '') + prompt + '\n\nRespond with valid JSON only.';
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: 'user', content: fullPrompt }],
  });
  const text = res.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Invalid JSON from Groq: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

export function isGroqConfigured(): boolean {
  return !!apiKey;
}
