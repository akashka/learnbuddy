import { NextRequest, NextResponse } from '@/lib/next-compat';
import { getAuthFromRequest } from '@/lib/auth';
import connectDB from '@/lib/db';
import { AIUsageLog } from '@/lib/models/AIUsageLog';

const AI_MODELS_CONFIG = [
  { id: 'gemini', name: 'Google Gemini', healthName: 'Gemini', models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'], capabilities: ['text', 'json', 'vision', 'audio'], knownLimit: '5–15 RPM, 25–1000 RPD (varies by model)' },
  { id: 'groq', name: 'Groq', healthName: 'Groq', models: ['llama-3.3-70b-versatile'], capabilities: ['text', 'json'], knownLimit: '~14,400 req/day, 30 RPM' },
  { id: 'huggingface', name: 'Hugging Face', healthName: 'HuggingFace', models: ['Llama-3.3-70B (via Groq)'], capabilities: ['text', 'json'], knownLimit: '~300 req/hour, $0.10/month credits' },
  { id: 'openrouter', name: 'OpenRouter', healthName: 'OpenRouter', models: ['openrouter/free'], capabilities: ['text', 'json', 'vision'], knownLimit: '~50 req/day (free models)' },
  { id: 'cloudflare', name: 'Cloudflare Workers AI', healthName: 'Cloudflare', models: ['@cf/meta/llama-3.1-8b-instruct'], capabilities: ['text', 'json'], knownLimit: '10,000 Neurons/day' },
  { id: 'together', name: 'Together AI', healthName: 'Together', models: ['Llama-3.2-11B-Vision', 'Llama-3.2-3B'], capabilities: ['text', 'json', 'vision'], knownLimit: 'Free tier, reduced rate limits' },
  { id: 'openai', name: 'OpenAI', healthName: 'OpenAI', models: ['gpt-4o-mini', 'gpt-3.5-turbo'], capabilities: ['text', 'json', 'vision', 'audio'], knownLimit: '$5 free credits (new accounts)' },
];

async function fetchProviderHealth(): Promise<{ text: Array<{ name: string; success: boolean; latencyMs: number; lastCheck: string; successCount: number; failureCount: number; lastError?: string }>; vision: unknown[]; audio: unknown[] } | null> {
  const url = process.env.AI_SERVICE_URL;
  const apiKey = process.env.AI_SERVICE_API_KEY;
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/health/providers`, {
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { text: Array<{ name: string; success: boolean; latencyMs: number; lastCheck: string; successCount: number; failureCount: number; lastError?: string }>; vision: unknown[]; audio: unknown[] };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configured = {
      gemini: !!process.env.GEMINI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      huggingface: !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN),
      openrouter: !!process.env.OPENROUTER_API_KEY,
      cloudflare: !!process.env.CLOUDFLARE_ACCOUNT_ID && !!process.env.CLOUDFLARE_API_TOKEN,
      together: !!process.env.TOGETHER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    await connectDB();
    const [health, usageToday, usageWeek, successToday, successWeek] = await Promise.all([
      fetchProviderHealth(),
      AIUsageLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      AIUsageLog.countDocuments({ createdAt: { $gte: startOfWeek } }),
      AIUsageLog.countDocuments({ createdAt: { $gte: startOfToday }, success: true }),
      AIUsageLog.countDocuments({ createdAt: { $gte: startOfWeek }, success: true }),
    ]);

    const textHealth = health?.text ?? [];
    const healthByProvider = new Map(textHealth.map((h) => [h.name, h]));

    const providers = AI_MODELS_CONFIG.map((p) => {
      const isConfigured = configured[p.id as keyof typeof configured] ?? false;
      const h = healthByProvider.get(p.healthName);
      const status = !isConfigured ? 'not_configured' : h ? (h.success ? 'healthy' : 'degraded') : 'unknown';
      return {
        id: p.id,
        name: p.name,
        models: p.models,
        capabilities: p.capabilities,
        knownLimit: p.knownLimit,
        configured: isConfigured,
        status,
        lastCheck: h?.lastCheck ?? null,
        latencyMs: h?.latencyMs ?? null,
        successCount: h?.successCount ?? 0,
        failureCount: h?.failureCount ?? 0,
        lastError: h?.lastError ?? null,
      };
    });

    return NextResponse.json({
      providers,
      fallbackOrder: ['Gemini', 'Groq', 'HuggingFace', 'OpenRouter', 'Cloudflare', 'Together', 'OpenAI'],
      usage: {
        today: usageToday,
        last7Days: usageWeek,
        successRateToday: usageToday > 0 ? Math.round((successToday / usageToday) * 100) : 100,
        successRateWeek: usageWeek > 0 ? Math.round((successWeek / usageWeek) * 100) : 100,
      },
    });
  } catch (error) {
    console.error('AI models config error:', error);
    return NextResponse.json({ error: 'Failed to get AI models config' }, { status: 500 });
  }
}
