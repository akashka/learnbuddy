/**
 * AI Provider Health Monitor - runs periodically to probe each provider.
 * Updates Redis with success/failure and latency for smart model selection.
 */
import { probeProvider } from './provider-health.js';
import { geminiGenerate, isGeminiConfigured } from '../providers/gemini.js';
import { groqGenerate, isGroqConfigured } from '../providers/groq.js';
import { huggingfaceGenerate, isHuggingfaceConfigured } from '../providers/huggingface.js';
import { openrouterGenerate, isOpenRouterConfigured } from '../providers/openrouter.js';
import { cloudflareGenerate, isCloudflareConfigured } from '../providers/cloudflare.js';
import { togetherGenerate, isTogetherConfigured } from '../providers/together.js';
import { openaiGenerate, isOpenAIConfigured } from '../providers/openai.js';

const PROBE_PROMPT = 'Reply with exactly: OK';

async function runProbes(): Promise<void> {
  const results: { name: string; text: boolean; vision?: boolean }[] = [];

  if (isGeminiConfigured()) {
    const r = await probeProvider('Gemini', 'text', () => geminiGenerate(PROBE_PROMPT));
    results.push({ name: 'Gemini', text: r.success });
  }
  if (isGroqConfigured()) {
    const r = await probeProvider('Groq', 'text', () => groqGenerate(PROBE_PROMPT));
    results.push({ name: 'Groq', text: r.success });
  }
  if (isHuggingfaceConfigured()) {
    const r = await probeProvider('HuggingFace', 'text', () => huggingfaceGenerate(PROBE_PROMPT));
    results.push({ name: 'HuggingFace', text: r.success });
  }
  if (isOpenRouterConfigured()) {
    const r = await probeProvider('OpenRouter', 'text', () => openrouterGenerate(PROBE_PROMPT));
    results.push({ name: 'OpenRouter', text: r.success });
  }
  if (isCloudflareConfigured()) {
    const r = await probeProvider('Cloudflare', 'text', () => cloudflareGenerate(PROBE_PROMPT));
    results.push({ name: 'Cloudflare', text: r.success });
  }
  if (isTogetherConfigured()) {
    const r = await probeProvider('Together', 'text', () => togetherGenerate(PROBE_PROMPT));
    results.push({ name: 'Together', text: r.success });
  }
  if (isOpenAIConfigured()) {
    const r = await probeProvider('OpenAI', 'text', () => openaiGenerate(PROBE_PROMPT));
    results.push({ name: 'OpenAI', text: r.success });
  }

  const ok = results.filter((r) => r.text).map((r) => r.name);
  const fail = results.filter((r) => !r.text).map((r) => r.name);
  console.log(`[AI Health] Probed ${results.length} providers. OK: ${ok.join(', ') || 'none'}. Fail: ${fail.join(', ') || 'none'}`);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startHealthMonitor(): void {
  if (intervalId) return;
  const intervalMs = parseInt(process.env.AI_HEALTH_CHECK_INTERVAL_MS || '300000', 10);
  if (intervalMs <= 0) return;
  console.log(`[AI Health] Starting provider health monitor (interval: ${intervalMs / 1000}s)`);
  runProbes(); // run immediately
  intervalId = setInterval(runProbes, intervalMs);
}

export function stopHealthMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[AI Health] Stopped provider health monitor');
  }
}
