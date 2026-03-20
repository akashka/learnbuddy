/**
 * AI Service - Doubt answering
 */
import { aiGenerate } from '../providers/unified.js';
import { withGeminiFallback } from './utils.js';
import { cacheGetOrSet, hashKey, AI_CACHE_TTL } from '../lib/cache.js';
import { analyzeSentiment, getSafeDisplayText } from './sentiment.js';

export interface DoubtAnswerResult {
  answer: string;
  questionWarning?: boolean;
  answerWarning?: boolean;
  sentimentScore?: number;
}

export async function answerDoubt(
  question: string,
  context: { subject: string; topic: string; board: string; classLevel: string }
): Promise<DoubtAnswerResult> {
  const trimmedQ = question.trim();
  const questionSentiment = await analyzeSentiment(trimmedQ);
  if (questionSentiment.score < 0.2) {
    throw new Error('Your question contains inappropriate content. Please rephrase and try again.');
  }

  const cacheKey = `doubt:${hashKey(JSON.stringify({ q: trimmedQ, ...context }))}`;
  const rawAnswer = await cacheGetOrSet(cacheKey, AI_CACHE_TTL, () =>
    withGeminiFallback(
      async () => {
        return await aiGenerate(
          `A student asks: "${trimmedQ}"\n\nContext: ${context.subject}, ${context.board} Class ${context.classLevel}, topic: ${context.topic}.\n\nProvide a clear, educational answer suitable for a school student. Use simple language and include examples if helpful. Format your answer with markdown: use **bold** for key terms, bullet points for lists, numbered steps when explaining procedures, and headings for distinct sections.`,
          'You are a patient and knowledgeable tutor helping Indian school students. Explain concepts clearly and encourage learning. Always use markdown formatting (bullets, numbered lists, bold for emphasis) to make answers easy to read.'
        );
      },
      `Based on ${context.subject} (${context.board} Class ${context.classLevel}) - ${context.topic}:\n\n${trimmedQ}\n\nAnswer: Please configure GEMINI_API_KEY for AI-powered doubt resolution.`
    )
  );

  const answerSentiment = await analyzeSentiment(rawAnswer);
  const { text: safeAnswer } = getSafeDisplayText(rawAnswer, answerSentiment);

  return {
    answer: safeAnswer,
    questionWarning: !questionSentiment.safe,
    answerWarning: !answerSentiment.safe,
    sentimentScore: Math.min(questionSentiment.score, answerSentiment.score),
  };
}
