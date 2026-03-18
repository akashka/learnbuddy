/**
 * AI Service - Generation (exams, study material)
 */
import { geminiGenerate, geminiGenerateJson, isGeminiConfigured } from '../providers/gemini.js';
import { withGeminiFallback } from './utils.js';
import { cacheGetOrSet, AI_CACHE_TTL } from '../lib/cache.js';
import { analyzeSentiment, getSafeDisplayText } from './sentiment.js';
import type { StudentExamQuestion, StudyMaterialContent, TeacherExamQuestion } from './types.js';
import type { ExamType } from './types.js';

export async function generateQualificationExam(
  subject: string,
  board: string,
  classLevel: string
): Promise<{ question: string; options: string[]; correctAnswer: number }[]> {
  return withGeminiFallback(
    async () => {
      const result = await geminiGenerateJson<{
        questions: { question: string; options: string[]; correctAnswer: number }[];
      }>(
        `Generate 5 MCQ questions for a teacher qualification exam. Subject: ${subject}, Board: ${board}, Class: ${classLevel}. Each question must have exactly 4 options. correctAnswer is 0-indexed (0=A, 1=B, 2=C, 3=D). Focus on teaching methodology, curriculum knowledge, and subject expertise.`,
        'You are an expert in Indian school education. Generate exam questions in valid JSON format.'
      );
      const questions = result.questions?.slice(0, 5) || [];
      for (const q of questions) {
        const sent = await analyzeSentiment(q.question);
        if (!sent.safe) {
          const { text } = getSafeDisplayText(q.question, sent);
          q.question = text;
        }
      }
      return questions;
    },
    getPlaceholderQualificationExam(subject, board, classLevel)
  );
}

function getPlaceholderQualificationExam(
  subject: string,
  board: string,
  classLevel: string
): { question: string; options: string[]; correctAnswer: number }[] {
  return [
    { question: `What is the main concept in ${subject} for ${classLevel}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0 },
    { question: `Explain the fundamental principle of ${subject}.`, options: ['Principle 1', 'Principle 2', 'Principle 3', 'Principle 4'], correctAnswer: 1 },
    { question: `Which approach is best for teaching ${subject} to ${classLevel}?`, options: ['Approach A', 'Approach B', 'Approach C', 'Approach D'], correctAnswer: 2 },
    { question: `How would you handle a difficult concept in ${subject}?`, options: ['Method 1', 'Method 2', 'Method 3', 'Method 4'], correctAnswer: 0 },
    { question: `What is the ${board} curriculum focus for ${subject}?`, options: ['Focus A', 'Focus B', 'Focus C', 'Focus D'], correctAnswer: 3 },
  ];
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

export async function generateStudentExamQuestions(
  subject: string,
  board: string,
  classLevel: string,
  examType: ExamType,
  topics?: string[]
): Promise<{ questions: StudentExamQuestion[]; timeLimit: number; totalMarks: number }> {
  const format = getExamFormat(examType, board, classLevel, subject);
  const { numQuestions, timeLimit, totalMarks } = format;
  const marksPerQ = Math.round(totalMarks / numQuestions);

  const topicHint =
    topics && topics.length > 0
      ? `Focus strictly on these topics: ${topics.join(', ')}.`
      : 'Cover key concepts from the entire syllabus as per the final exam pattern.';

  return withGeminiFallback(
    async () => {
      const result = await geminiGenerateJson<{
        questions: { question: string; type: string; options?: string[]; correctAnswer?: number | string; imageUrl?: string; requiresDrawing?: boolean }[];
      }>(
        `Generate ${numQuestions} exam questions for ${subject}, ${board} Class ${classLevel}. ${topicHint}
        Format must match the REAL final exam for this board, class and subject.
        Mix of: MCQ (4 options, correctAnswer 0-3), short/objective, and optionally questions that need diagrams or require students to draw.
        
        For questions needing a diagram (geometry, science diagrams, maps, etc): set "imageUrl" to a data URL of a simple SVG diagram, or leave empty for placeholder.
        For questions asking students to draw (e.g. "Draw the water cycle", "Sketch the diagram"): set "requiresDrawing": true.
        
        Return JSON: { "questions": [ { "question": "...", "type": "mcq"|"short"|"objective", "options": ["A","B","C","D"] for mcq, "correctAnswer": 0-3 or string, "imageUrl": "data:image/svg+xml;base64,..." or null, "requiresDrawing": true/false } ] }`
      );
      const qs = (result.questions || []).slice(0, numQuestions).map((q) => ({
        question: q.question,
        type: (q.type || 'mcq') as 'mcq' | 'objective' | 'short',
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: marksPerQ,
        imageUrl: q.imageUrl || undefined,
        requiresDrawing: q.requiresDrawing || false,
      }));
      // Sentiment check on generated questions
      for (const q of qs) {
        const sent = await analyzeSentiment(q.question);
        if (!sent.safe) {
          const { text } = getSafeDisplayText(q.question, sent);
          q.question = text;
        }
      }
      return { questions: qs, timeLimit, totalMarks };
    },
    getPlaceholderStudentExamQuestions(subject, board, classLevel, numQuestions, marksPerQ, timeLimit, totalMarks)
  );
}

/** Legacy support: map old examMode to new examType */
export function mapLegacyExamMode(examMode: string, examType?: string): ExamType {
  if (examType === 'quick_test' || examType === 'class_test' || examType === 'preparatory') {
    return examType;
  }
  if (examMode === 'quiz') return 'quick_test';
  if (examMode === 'full') return 'preparatory';
  return 'class_test';
}

function getPlaceholderStudentExamQuestions(
  subject: string,
  board: string,
  classLevel: string,
  numQuestions: number,
  marksPerQ: number,
  timeLimit: number,
  totalMarks: number
): { questions: StudentExamQuestion[]; timeLimit: number; totalMarks: number } {
  const topics = ['fundamentals', 'Key concepts', 'Application', 'Problem solving'];
  const questions: StudentExamQuestion[] = [];
  for (let i = 0; i < numQuestions; i++) {
    const t = topics[i % topics.length];
    if (i % 3 === 0) {
      questions.push({
        question: `[${board} Class ${classLevel} ${subject}] ${t}: What is the correct answer?`,
        type: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: i % 4,
        marks: marksPerQ,
      });
    } else {
      questions.push({
        question: `[${subject}] ${t}: Briefly explain.`,
        type: 'objective',
        correctAnswer: 'key concept',
        marks: marksPerQ,
      });
    }
  }
  return { questions, timeLimit, totalMarks };
}

function getConceptSvg(topic: string): string {
  const safe = String(topic).replace(/[<>"&]/g, '').slice(0, 40) || 'Concept';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="220" viewBox="0 0 500 220"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#10b981"/><stop offset="100%" style="stop-color:#059669"/></linearGradient></defs><rect width="500" height="220" fill="url(#bg)" rx="12"/><text x="250" y="100" text-anchor="middle" fill="white" font-size="24" font-weight="bold">📚 ${safe}</text><text x="250" y="140" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="14">Concept Overview</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generateStudyMaterial(
  subject: string,
  topic: string,
  board: string,
  classLevel: string
): Promise<{ title: string; summary: string; sections: StudyMaterialContent[] }> {
  const cacheKey = `sm:${subject}:${topic}:${board}:${classLevel}`.replace(/[^a-zA-Z0-9:_-]/g, '_');
  return cacheGetOrSet(cacheKey, AI_CACHE_TTL, () =>
    withGeminiFallback(
      async () => {
        const text = await geminiGenerate(
          `Create fun, engaging study material for ${subject}, topic: ${topic}, for ${board} Class ${classLevel} students.
        Use markdown with:
        1. **Introduction** - Start with a friendly hook, use emojis (📖 ✨ 💡) to make it engaging
        2. **Key Concepts** - Clear bullet points, simple language, real-life examples
        3. **Detailed Explanation** - Step-by-step, with examples. Use numbered lists where helpful
        4. **Important Points** - Formulas, definitions, or key facts (if applicable)
        5. **Practice Tips** - How to remember, common mistakes to avoid
        6. **Quick Recap** - Short summary
        Make it colorful in description, use emojis sparingly for emphasis, and align with Indian school curriculum. Write as if explaining to a curious student - friendly and encouraging.`,
          'You are an expert, friendly teacher creating fun study materials for Indian school students. Use simple language, real examples, and make learning enjoyable.'
        );
        let safeText = text;
        const textSentiment = await analyzeSentiment(text);
        if (!textSentiment.safe) {
          const { text: masked } = getSafeDisplayText(text, textSentiment);
          safeText = masked;
        }
        return {
          title: `${topic} - ${subject}`,
          summary: `Study material for ${topic} (${board} Class ${classLevel}).`,
          sections: [
            { type: 'text', content: safeText },
            {
              type: 'image',
              content: getConceptSvg(topic),
              caption: `${topic} - Concept overview`,
            },
          ],
        };
      },
      getPlaceholderStudyMaterial(subject, topic, board, classLevel)
    )
  );
}

function getPlaceholderStudyMaterial(
  subject: string,
  topic: string,
  board: string,
  classLevel: string
): { title: string; summary: string; sections: StudyMaterialContent[] } {
  return {
    title: `${topic} - ${subject}`,
    summary: `Study material for ${topic}.`,
    sections: [
      {
        type: 'text',
        content: `# ${topic}\n\nThis covers ${topic} for ${subject} (${board} Class ${classLevel}).\n\n## Key Concepts\n\n• Introduction and main points\n• Practical applications\n• Tips for exam preparation`,
      },
    ],
  };
}

export async function generateTeacherQualificationExam(
  combinations: { board: string; classLevel: string; subject: string }[],
  durationMinutes: number = 15
): Promise<TeacherExamQuestion[]> {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to .env.local');
  }
  const comboDesc = combinations
    .map((c) => `${c.board} Board, Class ${c.classLevel}, ${c.subject}`)
    .join('; ');
  const result = await geminiGenerateJson<{
    questions: { question: string; type: string; options?: string[]; correctAnswer?: number | string }[];
  }>(
    `You are an expert in Indian school curricula (CBSE, ICSE, State Boards). Generate 15 REAL qualification exam questions for teachers. Teaching combinations: ${comboDesc}.

Create curriculum-specific questions. For each board/class/subject:
- MCQ: Test actual syllabus concepts, formulas, definitions (e.g., Math Class 10: quadratic equations, trigonometry; Physics: motion, force; English: grammar)
- Short: Ask for specific concepts or terms from the syllabus
- NO generic placeholders like "Option A" or "What is the key teaching approach?"

Format: ~10 MCQ + ~5 short. MCQ: exactly 4 options, correctAnswer 0-3. Short: correctAnswer as string.
Return ONLY valid JSON: { "questions": [ { "question": "...", "type": "mcq"|"short", "options": ["...","...","...","..."] for mcq, "correctAnswer": 0-3 or "key answer" } ] }`
  );
  const questions = (result.questions || []).slice(0, 15).map((q) => ({
    question: q.question,
    type: (q.type || 'mcq') as 'mcq' | 'short',
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
  for (const q of questions) {
    const sent = await analyzeSentiment(q.question);
    if (!sent.safe) {
      const { text } = getSafeDisplayText(q.question, sent);
      q.question = text;
    }
  }
  if (questions.length === 0) {
    throw new Error('AI returned no questions. Please try again.');
  }
  return questions;
}
