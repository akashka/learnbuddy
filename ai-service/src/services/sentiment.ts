/**
 * AI Service - Sentiment & Content Safety Analysis
 * Detects abusive, violation, sexual, religious, hateful, etc. content.
 * Returns sentiment score (0-1) and optionally masked text.
 */
import { geminiGenerateJson } from '../providers/gemini.js';
import { withGeminiFallback } from './utils.js';

export interface SentimentResult {
  /** 0 = very unsafe, 1 = safe. Threshold: < 0.3 = low, show warning/mask */
  score: number;
  /** Whether content is safe for display */
  safe: boolean;
  /** Detected violation categories */
  flags: string[];
  /** Text with offending words/phrases replaced by *** */
  maskedText?: string;
  /** Brief reason if flags present */
  reason?: string;
}

const SENTIMENT_THRESHOLD = 0.3;

const SENTIMENT_PROMPT = `Analyze the following text for content safety. Check for:
- Abuse, profanity, foul language
- Sexual or inappropriate content
- Hate speech, religious slurs, discrimination
- Violence, threats, bullying
- Policy violations
- Any content unsuitable for an educational platform

Return JSON only:
{
  "score": <0.0 to 1.0, where 1 = completely safe, 0 = severe violation>,
  "flags": ["list of detected categories" or empty array],
  "maskedText": "<text with offending words replaced by ***>",
  "reason": "<brief reason if flags present, else empty string>"
}

Text to analyze (between TEXT_START and TEXT_END):
TEXT_START

`;

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { score: 1, safe: true, flags: [] };
  }

  const trimmed = text.trim();
  if (trimmed.length < 2) {
    return { score: 1, safe: true, flags: [] };
  }

  return withGeminiFallback(
    async () => {
      const result = await geminiGenerateJson<{
        score: number;
        flags: string[];
        maskedText?: string;
        reason?: string;
      }>(`${SENTIMENT_PROMPT}${trimmed}\n\nTEXT_END`, 'You are a content safety moderator. Be strict. Return valid JSON only.');

      const score = Math.max(0, Math.min(1, Number(result.score) ?? 1));
      const flags = Array.isArray(result.flags) ? result.flags : [];
      const safe = score >= SENTIMENT_THRESHOLD && flags.length === 0;

      return {
        score,
        safe,
        flags,
        maskedText: result.maskedText ?? (safe ? trimmed : maskOffendingWords(trimmed)),
        reason: result.reason ?? '',
      };
    },
    { score: 1, safe: true, flags: [], maskedText: trimmed, reason: '' }
  );
}

/** Fallback: simple regex-based masking when AI unavailable */
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

/** Batch analyze multiple text segments (e.g. exam answers) */
export async function analyzeSentimentBatch(
  texts: string[]
): Promise<SentimentResult[]> {
  const results: SentimentResult[] = [];
  for (const t of texts) {
    results.push(await analyzeSentiment(t));
  }
  return results;
}

/** Get display text: use masked if score is low, else original */
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

export function isLowSentiment(result: SentimentResult): boolean {
  return result.score < SENTIMENT_THRESHOLD || result.flags.length > 0;
}
