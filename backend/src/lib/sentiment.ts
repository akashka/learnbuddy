/**
 * Sentiment analysis - uses AI service when configured, else local Gemini, else safe fallback.
 */
import { aiGenerateJson, isAIConfigured } from '@/lib/ai-unified';
import * as aiClient from '@/lib/ai-client';
import { logAIUsage } from '@/lib/ai-audit';

export interface SentimentResult {
  score: number;
  safe: boolean;
  flags: string[];
  maskedText?: string;
  reason?: string;
}

const USE_AI_SERVICE = !!process.env.AI_SERVICE_URL && !!process.env.AI_SERVICE_API_KEY;
const SENTIMENT_THRESHOLD = 0.3;

function maskOffendingWords(text: string): string {
  const common = [
    /\b(shit|fuck|damn|ass|bitch|bastard|crap|hell)\b/gi,
    /\b(kill|murder|rape|abuse)\b/gi,
    /\b(hate|stupid|idiot|dumb)\b/gi,
  ];
  let out = text;
  for (const re of common) {
    out = out.replace(re, '***');
  }
  return out;
}

async function analyzeSentimentLocal(
  text: string,
  userId?: string,
  userRole?: string
): Promise<SentimentResult> {
  if (!isAIConfigured()) {
    return { score: 1, safe: true, flags: [] };
  }
  try {
    const response = await aiGenerateJson<{
      score: number;
      flags: string[];
      maskedText?: string;
      reason?: string;
    }>(
      `Analyze this text for content safety. Check for: abuse, profanity, sexual content, hate speech, religious slurs, violence, threats, bullying, policy violations. Return JSON only: { "score": <0.0 to 1.0>, "flags": ["list or empty"], "maskedText": "<text with offending words as ***>", "reason": "<brief reason or empty>" }\n\nText: "${(text || '').trim().replace(/"/g, '\\"')}"`,
      'You are a content safety moderator. Be strict. Return valid JSON only.'
    );
    const result = response.data;
    
    // Log usage
    if (response.usage) {
      logAIUsage({
        operationType: 'sentiment_analysis',
        userId,
        userRole,
        success: true,
        modelId: response.usage.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        inputMetadata: { textLength: text.length },
        outputMetadata: { score: result.score, flags: result.flags },
      }).catch(console.error);
    }

    const score = Math.max(0, Math.min(1, Number(result.score) ?? 1));
    const flags = Array.isArray(result.flags) ? result.flags : [];
    const safe = score >= SENTIMENT_THRESHOLD && flags.length === 0;
    return {
      score,
      safe,
      flags,
      maskedText: result.maskedText ?? (safe ? text : maskOffendingWords(text)),
      reason: result.reason ?? '',
    };
  } catch (err) {
    logAIUsage({
      operationType: 'sentiment_analysis',
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    }).catch(console.error);
    return { score: 1, safe: true, flags: [] };
  }
}

export async function analyzeSentiment(
  text: string,
  userId?: string,
  userRole?: string
): Promise<SentimentResult> {
  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return { score: 1, safe: true, flags: [] };
  }
  if (USE_AI_SERVICE) {
    try {
      return await aiClient.analyzeSentiment(text);
    } catch {
      return analyzeSentimentLocal(text, userId, userRole);
    }
  }
  return analyzeSentimentLocal(text, userId, userRole);
}

export function isLowSentiment(result: SentimentResult): boolean {
  return result.score < SENTIMENT_THRESHOLD || result.flags.length > 0;
}

export function getSafeDisplayText(
  original: string,
  result: SentimentResult
): { text: string; warning: boolean } {
  if (result.safe) {
    return { text: original, warning: false };
  }
  return {
    text: result.maskedText ?? maskOffendingWords(original),
    warning: true,
  };
}
