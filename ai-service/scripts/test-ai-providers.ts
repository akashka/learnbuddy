#!/usr/bin/env npx tsx
/**
 * Test each AI provider with a simple generation request.
 * Run from ai-service: npx tsx scripts/test-ai-providers.ts
 */
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env from ai-service root
import { config } from 'dotenv';
config({ path: join(root, '.env') });

const TEXT_PROMPT = 'Generate exactly one MCQ question for Class 10 Science on photosynthesis. Format: Question, then 4 options A-D, then correct answer letter. Keep it brief.';
const JSON_PROMPT = `Generate one MCQ for Class 10 Science: What is photosynthesis? Return valid JSON only: { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }`;

type ProviderResult = {
  name: string;
  configured: boolean;
  textOk: boolean;
  jsonOk: boolean;
  textError?: string;
  jsonError?: string;
  textPreview?: string;
  jsonPreview?: string;
  durationMs?: number;
};

async function testProvider(
  name: string,
  isConfigured: () => boolean,
  textFn: () => Promise<string>,
  jsonFn?: () => Promise<unknown>
): Promise<ProviderResult> {
  const result: ProviderResult = { name, configured: isConfigured(), textOk: false, jsonOk: false };
  if (!result.configured) return result;

  try {
    const start = Date.now();
    const text = await textFn();
    result.durationMs = Date.now() - start;
    if (text && text.trim().length > 10) {
      result.textOk = true;
      result.textPreview = text.slice(0, 120).replace(/\n/g, ' ') + (text.length > 120 ? '...' : '');
    } else {
      result.textError = `Empty or too short response (${text?.length ?? 0} chars)`;
    }
  } catch (err) {
    result.textError = err instanceof Error ? err.message : String(err);
  }

  if (jsonFn) {
    try {
      const json = await jsonFn();
      if (json && typeof json === 'object') {
        result.jsonOk = true;
        result.jsonPreview = JSON.stringify(json).slice(0, 100) + '...';
      } else {
        result.jsonError = 'Invalid or empty JSON response';
      }
    } catch (err) {
      result.jsonError = err instanceof Error ? err.message : String(err);
    }
  }

  return result;
}

async function main() {
  console.log('\n=== AI Provider Health Check ===\n');
  console.log('Testing each configured provider with a simple generation request...\n');

  const results: ProviderResult[] = [];

  // Gemini
  try {
    const { geminiGenerate, geminiGenerateJson, isGeminiConfigured } = await import('../src/providers/gemini.js');
    results.push(
      await testProvider(
        'Gemini',
        isGeminiConfigured,
        () => geminiGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => geminiGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({ name: 'Gemini', configured: !!process.env.GEMINI_API_KEY, textOk: false, jsonOk: false, textError: String(e) });
  }

  // Groq
  try {
    const { groqGenerate, groqGenerateJson, isGroqConfigured } = await import('../src/providers/groq.js');
    results.push(
      await testProvider(
        'Groq',
        isGroqConfigured,
        () => groqGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => groqGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({ name: 'Groq', configured: !!process.env.GROQ_API_KEY, textOk: false, jsonOk: false, textError: String(e) });
  }

  // Hugging Face
  try {
    const { huggingfaceGenerate, huggingfaceGenerateJson, isHuggingfaceConfigured } = await import('../src/providers/huggingface.js');
    results.push(
      await testProvider(
        'Hugging Face',
        isHuggingfaceConfigured,
        () => huggingfaceGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => huggingfaceGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({
      name: 'Hugging Face',
      configured: !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN),
      textOk: false,
      jsonOk: false,
      textError: String(e),
    });
  }

  // OpenRouter
  try {
    const { openrouterGenerate, openrouterGenerateJson, isOpenRouterConfigured } = await import('../src/providers/openrouter.js');
    results.push(
      await testProvider(
        'OpenRouter',
        isOpenRouterConfigured,
        () => openrouterGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => openrouterGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({ name: 'OpenRouter', configured: !!process.env.OPENROUTER_API_KEY, textOk: false, jsonOk: false, textError: String(e) });
  }

  // Cloudflare
  try {
    const { cloudflareGenerate, cloudflareGenerateJson, isCloudflareConfigured } = await import('../src/providers/cloudflare.js');
    results.push(
      await testProvider(
        'Cloudflare',
        isCloudflareConfigured,
        () => cloudflareGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => cloudflareGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({
      name: 'Cloudflare',
      configured: !!process.env.CLOUDFLARE_ACCOUNT_ID && !!process.env.CLOUDFLARE_API_TOKEN,
      textOk: false,
      jsonOk: false,
      textError: String(e),
    });
  }

  // Together
  try {
    const { togetherGenerate, togetherGenerateJson, isTogetherConfigured } = await import('../src/providers/together.js');
    results.push(
      await testProvider(
        'Together AI',
        isTogetherConfigured,
        () => togetherGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => togetherGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({ name: 'Together AI', configured: !!process.env.TOGETHER_API_KEY, textOk: false, jsonOk: false, textError: String(e) });
  }

  // OpenAI
  try {
    const { openaiGenerate, openaiGenerateJson, isOpenAIConfigured } = await import('../src/providers/openai.js');
    results.push(
      await testProvider(
        'OpenAI',
        isOpenAIConfigured,
        () => openaiGenerate(TEXT_PROMPT, 'You are a helpful teacher.'),
        () => openaiGenerateJson<{ question: string; options: string[]; correctAnswer: number }>(JSON_PROMPT)
      )
    );
  } catch (e) {
    results.push({ name: 'OpenAI', configured: !!process.env.OPENAI_API_KEY, textOk: false, jsonOk: false, textError: String(e) });
  }

  // Print results
  console.log('Provider        | Config | Text  | JSON  | Duration | Notes');
  console.log('----------------|--------|-------|-------|----------|------');

  for (const r of results) {
    const config = r.configured ? '✓' : '-';
    const text = r.configured ? (r.textOk ? '✓' : '✗') : '-';
    const json = r.configured && (r.jsonPreview !== undefined || r.jsonError) ? (r.jsonOk ? '✓' : '✗') : '-';
    const dur = r.durationMs != null ? `${r.durationMs}ms` : '-';
    const notes = r.textError || r.jsonError || (r.textOk ? '' : '-') || '';
    console.log(
      `${r.name.padEnd(15)} | ${config.padEnd(6)} | ${text.padEnd(5)} | ${json.padEnd(5)} | ${dur.padEnd(8)} | ${notes.slice(0, 40)}`
    );
  }

  console.log('\n--- Details ---\n');
  for (const r of results) {
    if (!r.configured) continue;
    console.log(`\n${r.name}:`);
    if (r.textError) console.log(`  Text error: ${r.textError}`);
    if (r.jsonError) console.log(`  JSON error: ${r.jsonError}`);
    if (r.textOk && r.textPreview) console.log(`  Text preview: ${r.textPreview}`);
    if (r.jsonOk && r.jsonPreview) console.log(`  JSON preview: ${r.jsonPreview}`);
  }

  const working = results.filter((r) => r.configured && (r.textOk || r.jsonOk)).length;
  const configured = results.filter((r) => r.configured).length;
  console.log(`\n=== Summary: ${working}/${configured} configured providers responding correctly ===\n`);

  // Helpful hints for common failures
  const hfFail = results.find((r) => r.name === 'Hugging Face' && r.configured && !r.textOk);
  if (hfFail?.textError?.includes('not supported by any provider')) {
    console.log('Hugging Face: Enable providers at https://huggingface.co/settings/inference-providers\n');
  }
}

main().catch((e) => {
  console.error('Script failed:', e);
  process.exit(1);
});
