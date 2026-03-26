/**
 * AI Service HTTP client - calls independent AI service when configured.
 * Uses circuit breaker: after repeated failures, fail fast instead of long timeouts.
 */
import { withCircuitBreaker } from './circuit-breaker.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || '';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

export type ExamType = 'quick_test' | 'class_test' | 'preparatory';

export interface StudentExamQuestion {
  question: string;
  type: 'mcq' | 'objective' | 'short';
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  imageUrl?: string;
  requiresDrawing?: boolean;
}

export interface TeacherExamQuestion {
  question: string;
  type: 'mcq' | 'short';
  options?: string[];
  correctAnswer?: number | string;
}

function isConfigured(): boolean {
  return !!AI_SERVICE_URL && !!AI_SERVICE_API_KEY;
}

async function call<T>(
  path: string,
  body: Record<string, unknown>,
  options?: { timeout?: number }
): Promise<T> {
  return withCircuitBreaker(async () => {
    const res = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_SERVICE_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options?.timeout ?? 60000),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data as { message?: string; error?: string }).message || (data as { error?: string }).error || 'AI service error');
    }
    return data as T;
  });
}

export async function generateQualificationExam(
  subject: string,
  board: string,
  classLevel: string
): Promise<{ question: string; options: string[]; correctAnswer: number }[]> {
  const data = await call<{ questions: { question: string; options: string[]; correctAnswer: number }[] }>(
    '/v1/generate/qualification-exam',
    { subject, board, classLevel }
  );
  return data.questions || [];
}

export async function generateStudentExamQuestions(
  subject: string,
  board: string,
  classLevel: string,
  examType: ExamType,
  topics?: string[],
  answerInputType?: 'typed' | 'photo' | 'audio'
): Promise<{ questions: StudentExamQuestion[]; timeLimit: number; totalMarks: number }> {
  return call('/v1/generate/student-exam', {
    subject,
    board,
    classLevel,
    examType,
    topics,
    answerInputType,
  });
}

export interface Flashcard {
  front: string;
  back: string;
}

export async function generateStudyMaterial(
  subject: string,
  topic: string,
  board: string,
  classLevel: string,
  options?: { includeFlashcards?: boolean }
): Promise<{ title: string; summary: string; sections: { type: string; content: string; caption?: string }[]; flashcards?: Flashcard[] }> {
  return call('/v1/generate/study-material', { subject, topic, board, classLevel, includeFlashcards: options?.includeFlashcards });
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  board: string,
  classLevel: string
): Promise<{ cards: Flashcard[] }> {
  return call('/v1/generate/flashcards', { subject, topic, board, classLevel });
}

export async function generateFlashcardsFromStudyMaterial(
  studyMaterialText: string,
  topic: string,
  subject: string
): Promise<{ cards: Flashcard[] }> {
  return call('/v1/generate/flashcards-from-material', { studyMaterialText, topic, subject });
}

export async function generateFlashcardsFromExamFeedback(
  feedback: { good?: string[]; bad?: string[]; overall?: string; questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[] },
  questions: { question: string; type?: string }[],
  subject: string,
  board: string,
  classLevel: string
): Promise<{ cards: Flashcard[] }> {
  return call('/v1/generate/flashcards-from-exam', { feedback, questions, subject, board, classLevel });
}

export async function generateTeacherQualificationExam(
  combinations: { board: string; classLevel: string; subject: string }[],
  durationMinutes?: number
): Promise<TeacherExamQuestion[]> {
  const data = await call<{ questions: TeacherExamQuestion[] }>(
    '/v1/generate/teacher-qualification-exam',
    { combinations, durationMinutes: durationMinutes ?? 15 }
  );
  return data.questions || [];
}

export async function evaluateStudentExam(
  questions: StudentExamQuestion[],
  answers: (number | string | { value?: number | string })[]
): Promise<{
  score: number;
  feedback: {
    good: string[];
    bad: string[];
    overall: string;
    questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[];
    questionDetails?: unknown[];
    lowSentimentWarning?: boolean;
  };
}> {
  return call('/v1/evaluate/exam', { questions, answers, type: 'student' });
}

export function evaluateTeacherExam(
  questions: TeacherExamQuestion[],
  answers: (number | string)[]
): { score: number; passed: boolean } {
  let correct = 0;
  questions.forEach((q, i) => {
    const ans = answers[i];
    if (q.type === 'mcq' && typeof ans === 'number' && ans === q.correctAnswer) correct++;
    if (q.type === 'short' && ans && String(ans).trim().length > 2) correct++;
  });
  const score = Math.round((correct / questions.length) * 100);
  return { score, passed: score >= 60 };
}

export async function analyzeClassroomFrame(
  frame: string,
  role: 'student' | 'teacher',
  referencePhotoUrl?: string | null
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return call('/v1/monitor/classroom', { frame, role, referencePhotoUrl: referencePhotoUrl ?? undefined });
}

export async function analyzeExamFrame(
  studentFrame: string
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return call('/v1/monitor/exam', { studentFrame });
}

export async function analyzeExamFrameWithAudio(
  studentFrame: string,
  audioDataUrl?: string | null
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return call('/v1/monitor/exam', { studentFrame, audioDataUrl: audioDataUrl ?? undefined });
}

export async function answerDoubt(
  question: string,
  context: { subject: string; topic: string; board: string; classLevel: string }
): Promise<{ answer: string; questionWarning?: boolean; answerWarning?: boolean; sentimentScore?: number }> {
  const data = await call<{ answer: string; questionWarning?: boolean; answerWarning?: boolean; sentimentScore?: number }>(
    '/v1/doubt/ask',
    { question, context }
  );
  return {
    answer: data.answer ?? '',
    questionWarning: data.questionWarning,
    answerWarning: data.answerWarning,
    sentimentScore: data.sentimentScore,
  };
}

export async function verifyDocumentPhoto(
  documentImageUrl: string,
  profilePhotoUrl: string
): Promise<'verified' | 'not_verified' | 'partially_verified'> {
  const data = await call<{ result: string }>('/v1/monitor/verify-document', {
    documentImageUrl,
    profilePhotoUrl,
  });
  const r = (data as { result?: string }).result ?? 'verified';
  return r as 'verified' | 'not_verified' | 'partially_verified';
}

export function mapLegacyExamMode(examMode: string, examType?: string): ExamType {
  if (examType === 'quick_test' || examType === 'class_test' || examType === 'preparatory') {
    return examType;
  }
  if (examMode === 'quiz') return 'quick_test';
  if (examMode === 'full') return 'preparatory';
  return 'class_test';
}

export function getExamFormat(
  examType: ExamType,
  board: string,
  classLevel: string,
  subject: string
): { numQuestions: number; timeLimit: number; totalMarks: number; description: string } {
  const isPreparatory = examType === 'preparatory';
  const isQuickTest = examType === 'quick_test';
  if (isPreparatory) {
    return {
      numQuestions: 20,
      timeLimit: 120,
      totalMarks: 100,
      description: `Full preparatory exam matching ${board} Class ${classLevel} ${subject} final exam format. Covers entire syllabus.`,
    };
  }
  if (isQuickTest) {
    return {
      numQuestions: 5,
      timeLimit: 15,
      totalMarks: 25,
      description: `Quick test on one topic. 5 questions, 15 minutes.`,
    };
  }
  return {
    numQuestions: 10,
    timeLimit: 35,
    totalMarks: 50,
    description: `Class test on 1-3 topics. 10 questions, 35 minutes.`,
  };
}

/** Use AI service when configured, else fall back to local */
export function useAIService(): boolean {
  return isConfigured();
}

export interface SentimentResult {
  score: number;
  safe: boolean;
  flags: string[];
  maskedText?: string;
  reason?: string;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return { score: 1, safe: true, flags: [] };
  }
  const data = await call<SentimentResult>('/v1/sentiment/analyze', { text });
  return data;
}
