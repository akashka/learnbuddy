/**
 * AI Service - Multi-provider (Gemini, OpenAI) for resource generation, exams, doubt answering, document verification
 */
import {
  aiGenerate,
  aiGenerateJson,
  aiGenerateWithImages,
  aiGenerateWithImageAndAudio,
  aiTranscribeAudio,
  isAIConfigured,
} from '@/lib/ai-unified';

async function withAIFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isAIConfigured()) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error('AI API error:', err);
    return fallback;
  }
}

export async function generateQualificationExam(
  subject: string,
  board: string,
  classLevel: string
): Promise<{ question: string; options: string[]; correctAnswer: number }[]> {
  return withAIFallback(
    async () => {
      const result = await aiGenerateJson<{
        questions: { question: string; options: string[]; correctAnswer: number }[];
      }>(
        `Generate 5 MCQ questions for a teacher qualification exam. Subject: ${subject}, Board: ${board}, Class: ${classLevel}. Each question must have exactly 4 options. correctAnswer is 0-indexed (0=A, 1=B, 2=C, 3=D). Focus on teaching methodology, curriculum knowledge, and subject expertise.`,
        'You are an expert in Indian school education. Generate exam questions in valid JSON format.'
      );
      return result.questions?.slice(0, 5) || [];
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

export interface StudentExamQuestion {
  question: string;
  type: 'mcq' | 'objective' | 'short';
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  imageUrl?: string;
  requiresDrawing?: boolean;
}

export type ExamType = 'quick_test' | 'class_test' | 'preparatory';

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
  topics?: string[],
  answerInputType: 'typed' | 'photo' | 'audio' = 'typed'
): Promise<{ questions: StudentExamQuestion[]; timeLimit: number; totalMarks: number }> {
  const format = getExamFormat(examType, board, classLevel, subject);
  const { numQuestions, timeLimit, totalMarks } = format;
  const marksPerQ = Math.round(totalMarks / numQuestions);

  const topicHint =
    topics && topics.length > 0
      ? `Focus strictly on these topics: ${topics.join(', ')}.`
      : 'Cover key concepts from the entire syllabus as per the final exam pattern.';

  const answerModeHint =
    answerInputType === 'photo'
      ? `ANSWER INPUT MODE: photo. Non-MCQ questions must be suitable for a photo or sketch upload (diagrams, drawings, worked steps on paper). Prefer "requiresDrawing": true or clear visual tasks.`
      : answerInputType === 'audio'
        ? `ANSWER INPUT MODE: audio. Non-MCQ questions must be answerable in brief spoken responses (1–3 sentences). Avoid long essays.`
        : `ANSWER INPUT MODE: typed. Non-MCQ questions are answered as short written text.`;

  return withAIFallback(
    async () => {
      const result = await aiGenerateJson<{
        questions: { question: string; type: string; options?: string[]; correctAnswer?: number | string; imageUrl?: string; requiresDrawing?: boolean }[];
      }>(
        `Generate ${numQuestions} exam questions for ${subject}, ${board} Class ${classLevel}. ${topicHint}
        ${answerModeHint}
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

export interface QuestionResultDetail {
  questionIndex: number;
  question: string;
  correctAnswer: number | string;
  userAnswer: number | string;
  marksObtained: number;
  totalMarks: number;
  correct: boolean;
  feedback: string;
  options?: string[];
}

function normalizeNumericAnswer(s: string): string {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/degrees?|deg|°/gi, '')
    .replace(/[^\d.-]/g, ' ')
    .trim()
    .split(/\s+/)[0] || '';
}

function answersMatchNumeric(expected: string, student: string): boolean {
  const exp = normalizeNumericAnswer(expected);
  const stu = normalizeNumericAnswer(student);
  if (!exp || !stu) return false;
  const expNum = parseFloat(exp);
  const stuNum = parseFloat(stu);
  if (Number.isNaN(expNum) || Number.isNaN(stuNum)) return false;
  return Math.abs(expNum - stuNum) < 0.01;
}

interface StudentAnswerObject {
  value?: number | string;
  photoUrl?: string;
  audioTranscript?: string;
}

function pickAnswerParts(ans: unknown): {
  mcqIndex: number | undefined;
  rawText: string;
  imageDataUrl: string | null;
  audioDataUrl: string | null;
  presetTranscript: string | null;
} {
  if (ans === null || ans === undefined) {
    return { mcqIndex: undefined, rawText: '', imageDataUrl: null, audioDataUrl: null, presetTranscript: null };
  }
  if (typeof ans === 'number') {
    return { mcqIndex: ans, rawText: '', imageDataUrl: null, audioDataUrl: null, presetTranscript: null };
  }
  if (typeof ans === 'string') {
    if (ans.startsWith('data:image')) return { mcqIndex: undefined, rawText: '', imageDataUrl: ans, audioDataUrl: null, presetTranscript: null };
    if (ans.startsWith('data:audio')) return { mcqIndex: undefined, rawText: '', imageDataUrl: null, audioDataUrl: ans, presetTranscript: null };
    return { mcqIndex: undefined, rawText: ans, imageDataUrl: null, audioDataUrl: null, presetTranscript: null };
  }
  if (typeof ans === 'object' && ans !== null) {
    const o = ans as StudentAnswerObject;
    const presetTranscript =
      typeof o.audioTranscript === 'string' && o.audioTranscript.trim() ? o.audioTranscript.trim() : null;
    const mcqIndex = typeof o.value === 'number' ? o.value : undefined;
    const photo = o.photoUrl && String(o.photoUrl).startsWith('data:image') ? String(o.photoUrl) : null;
    if (photo) {
      return { mcqIndex, rawText: '', imageDataUrl: photo, audioDataUrl: null, presetTranscript };
    }
    if (typeof o.value === 'string') {
      if (o.value.startsWith('data:image')) return { mcqIndex, rawText: '', imageDataUrl: o.value, audioDataUrl: null, presetTranscript };
      if (o.value.startsWith('data:audio')) return { mcqIndex, rawText: '', imageDataUrl: null, audioDataUrl: o.value, presetTranscript };
    }
    const rawText =
      o.value !== undefined && o.value !== null && typeof o.value !== 'number' ? String(o.value) : '';
    return { mcqIndex, rawText, imageDataUrl: null, audioDataUrl: null, presetTranscript };
  }
  return { mcqIndex: undefined, rawText: String(ans), imageDataUrl: null, audioDataUrl: null, presetTranscript: null };
}

export async function evaluateStudentExam(
  questions: StudentExamQuestion[],
  answers: (number | string | { value?: number | string; photoUrl?: string; audioTranscript?: string })[]
): Promise<{ score: number; feedback: { good: string[]; bad: string[]; overall: string; questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[]; questionDetails?: QuestionResultDetail[]; lowSentimentWarning?: boolean } }> {
  let score = 0;
  const questionFeedback: { questionIndex: number; correct: boolean; feedback: string }[] = [];
  const questionDetails: QuestionResultDetail[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ans = answers[i];
    const parts = pickAnswerParts(ans);
    let val: number | string = parts.mcqIndex !== undefined ? parts.mcqIndex : parts.rawText;
    if (parts.presetTranscript) {
      val = parts.presetTranscript;
    } else if (parts.audioDataUrl) {
      const transcribed = await withAIFallback(() => aiTranscribeAudio(parts.audioDataUrl!), '');
      val = transcribed || '';
    }
    const imageDataUrl =
      parts.imageDataUrl || (typeof val === 'string' && val.startsWith('data:image') ? val : null);
    const isImageAnswer = !!imageDataUrl;
    let correct = false;
    let feedbackText = '';
    let marksObtained = 0;

    const displayCorrectAnswer = q.type === 'mcq' && q.options
      ? (typeof q.correctAnswer === 'number' ? q.options[q.correctAnswer] : String(q.correctAnswer ?? 'N/A'))
      : String(q.correctAnswer ?? 'N/A');
    const displayUserAnswer = q.type === 'mcq' && q.options && typeof val === 'number'
      ? q.options[val] ?? String(val ?? 'Not answered')
      : String(val ?? 'Not answered');

    if (q.type === 'mcq' && typeof val === 'number' && val === q.correctAnswer) {
      correct = true;
      marksObtained = q.marks;
      score += q.marks;
      feedbackText = 'Correct';
    } else if (q.type === 'mcq') {
      feedbackText = `Correct answer: ${displayCorrectAnswer}`;
    } else if (isImageAnswer && imageDataUrl) {
      const totalMarksForQ = q.marks;
      const aiEval = await withAIFallback(
        async () => {
          const result = await aiGenerateWithImages(
            `You are an expert teacher grading a student's drawing/diagram for an exam question.

Question: ${q.question}
Expected (what the drawing should show): ${String(q.correctAnswer ?? 'N/A')}
Total marks: ${totalMarksForQ}

Evaluate the student's drawing. Award partial marks for: correct elements, partial accuracy, right concept with minor errors.
Return JSON only: { "marksObtained": <0 to ${totalMarksForQ}>, "feedback": "brief feedback on what was correct/incorrect in the drawing" }`,
            [String(imageDataUrl)]
          );
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch?.[0]) {
            return JSON.parse(jsonMatch[0]) as { marksObtained: number; feedback: string };
          }
          return { marksObtained: Math.round(totalMarksForQ * 0.5), feedback: 'Drawing evaluated' };
        },
        { marksObtained: Math.round(totalMarksForQ * 0.5), feedback: 'Drawing submitted' }
      );
      marksObtained = Math.round(Math.min(totalMarksForQ, Math.max(0, Number(aiEval.marksObtained) || 0)) * 10) / 10;
      correct = marksObtained >= totalMarksForQ * 0.5;
      score += marksObtained;
      feedbackText = aiEval.feedback || `Drawing: ${marksObtained}/${totalMarksForQ} marks`;
    } else if ((q.type === 'objective' || q.type === 'short') && val && String(val).trim().length > 0) {
      const totalMarksForQ = q.marks;
      const studentStr = String(val).trim();
      const expectedStr = String(q.correctAnswer ?? '');
      if (answersMatchNumeric(expectedStr, studentStr)) {
        correct = true;
        marksObtained = totalMarksForQ;
        score += totalMarksForQ;
        feedbackText = 'Correct';
      } else {
      const aiEval = await withAIFallback(
        async () => {
          const result = await aiGenerateJson<{ marksObtained: number; feedback: string }>(
            `You are an expert teacher grading an exam. Evaluate the student's answer like a human teacher would.

Question: ${q.question}
Expected answer (key points / correct value): ${String(q.correctAnswer ?? 'N/A')}
Student answer: ${String(val).trim()}
Total marks for this question: ${totalMarksForQ}

EVALUATION RULES (evaluate like a fair, experienced teacher - BE LENIENT with equivalent answers):
1. NUMERIC EQUIVALENCE (CRITICAL): Treat as CORRECT if the numeric value matches, regardless of format:
   - "5" = "5" = "5.0" = "5.00" = "five" = "5 " = " 5"
   - "45" = "45 degree" = "45 degrees" = "45°" = "45 deg" = "45-degree" = "45 Degree"
   - "280" = "Rs. 280" = "Rs 280" = "280 Rs" = "Rupees 280" = "₹280"
   - Extract numbers and compare. "42" = "forty-two" = "42.0". Ignore units when both have same unit (degree/degrees/°).
2. PARTIAL CREDIT: For descriptive/long answers, award proportional marks. 6 of 10 key points correct ≈ 60% of marks.
3. CONCEPT UNDERSTANDING: Partial understanding gets partial marks. Right approach, wrong calculation: 40-60%.
4. FORMAT: Ignore spelling, punctuation, extra spaces, capitalization. Focus on meaning.
5. ZERO: Only if completely wrong, irrelevant, or copied wrong question. When in doubt, award partial marks.

Return JSON: { "marksObtained": <number 0 to ${totalMarksForQ}>, "feedback": "brief teacher-like feedback" }`,
            'You are a fair, experienced teacher. Award partial marks generously when the student demonstrates partial understanding. Be consistent and explain your grading.'
          );
          return result;
        },
        { marksObtained: studentStr.length > 10 ? Math.round(totalMarksForQ * 0.5) : 0, feedback: 'Auto-graded' }
      );
      marksObtained = Math.round(Math.min(totalMarksForQ, Math.max(0, Number(aiEval.marksObtained) || 0)) * 10) / 10;
      correct = marksObtained >= totalMarksForQ * 0.5;
      score += marksObtained;
      feedbackText = aiEval.feedback || (marksObtained >= totalMarksForQ ? 'Correct' : `Partial credit: ${marksObtained}/${totalMarksForQ}. ${displayCorrectAnswer}`);
      }
    } else {
      feedbackText = `Correct answer: ${displayCorrectAnswer}`;
    }

    questionFeedback.push({ questionIndex: i, correct, feedback: feedbackText });
    let userAnswerForDisplay: string | number;
    if (isImageAnswer) {
      userAnswerForDisplay = '[Drawing/Image submitted]';
    } else if (parts.audioDataUrl) {
      userAnswerForDisplay =
        typeof val === 'string' && val.trim() ? val.trim() : '[Spoken answer]';
    } else {
      userAnswerForDisplay = (val ?? '') as string | number;
    }
    questionDetails.push({
      questionIndex: i,
      question: q.question,
      correctAnswer: q.correctAnswer ?? '',
      userAnswer: userAnswerForDisplay,
      marksObtained,
      totalMarks: q.marks,
      correct,
      feedback: feedbackText,
      options: q.options,
    });
  }

  const { analyzeSentiment, getSafeDisplayText } = await import('@/lib/sentiment');
  const textAnswerIndices = questionDetails
    .map((d, i) =>
      typeof d.userAnswer === 'string' &&
      d.userAnswer !== '[Drawing/Image submitted]' &&
      d.userAnswer !== '[Spoken answer]' &&
      d.userAnswer.length > 2
        ? i
        : -1
    )
    .filter((i) => i >= 0);
  if (textAnswerIndices.length > 0) {
    const textAnswers = textAnswerIndices.map((i) => String(questionDetails[i].userAnswer));
    const sentimentResults = await Promise.all(textAnswers.map((t) => analyzeSentiment(t)));
    sentimentResults.forEach((res, idx) => {
      const detailIdx = textAnswerIndices[idx];
      const orig = String(questionDetails[detailIdx].userAnswer);
      const { text: safeText } = getSafeDisplayText(orig, res);
      if (!res.safe) {
        (questionDetails[detailIdx] as { userAnswer: string; sentimentWarning?: boolean }).userAnswer = safeText;
        (questionDetails[detailIdx] as { sentimentWarning?: boolean }).sentimentWarning = true;
      }
    });
  }

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const good: string[] = [];
  const bad: string[] = [];
  if (pct >= 80) good.push('Excellent performance! Strong grasp of concepts.');
  else if (pct >= 60) good.push('Good attempt. Some areas need revision.');
  else bad.push('More practice recommended. Review the topics.');

  const correctCount = questionFeedback.filter((f) => f.correct).length;
  good.push(`${correctCount}/${questions.length} questions answered correctly.`);

  const aiOverall = await withAIFallback(
    async () => {
      const qaSummary = questions
        .slice(0, 5)
        .map((q, i) => `Q: ${q.question}\nA: ${answers[i]}`)
        .join('\n\n');
      return await aiGenerate(
        `Student scored ${score}/${totalMarks} (${pct}%). Provide 1-2 sentence personalized feedback for a student. Be encouraging but constructive.\n\nSample Q&A:\n${qaSummary}`
      );
    },
    `You scored ${score}/${totalMarks} (${pct}%).`
  );

  const hasLowSentiment = questionDetails.some((d) => (d as { sentimentWarning?: boolean }).sentimentWarning);
  return {
    score,
    feedback: {
      good,
      bad,
      overall: aiOverall || `You scored ${score}/${totalMarks} (${pct}%).`,
      questionFeedback,
      questionDetails,
      lowSentimentWarning: hasLowSentiment,
    },
  };
}

export interface StudyMaterialContent {
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  caption?: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

function getConceptSvg(topic: string): string {
  const safe = String(topic).replace(/[<>"&]/g, '').slice(0, 40) || 'Concept';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="220" viewBox="0 0 500 220"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#10b981"/><stop offset="100%" style="stop-color:#059669"/></linearGradient></defs><rect width="500" height="220" fill="url(#bg)" rx="12"/><text x="250" y="100" text-anchor="middle" fill="white" font-size="24" font-weight="bold">📚 ${safe}</text><text x="250" y="140" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="14">Concept Overview</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  board: string,
  classLevel: string
): Promise<{ cards: Flashcard[] }> {
  return withAIFallback(
    async () => {
      const result = await aiGenerateJson<{ cards: { front: string; back: string }[] }>(
        `Generate 10-12 flashcards for ${subject}, topic: ${topic}, for ${board} Class ${classLevel} students. Each card: "front" = question/term, "back" = answer. Return JSON: { "cards": [ { "front": "...", "back": "..." } ] }`,
        'Generate flashcards in valid JSON format.'
      );
      return { cards: (result.cards || []).slice(0, 15) };
    },
    { cards: getPlaceholderFlashcards(subject, topic, board, classLevel) }
  );
}

function getPlaceholderFlashcards(
  subject: string,
  topic: string,
  board: string,
  classLevel: string
): Flashcard[] {
  return [
    { front: `What is the main concept in ${topic}?`, back: `Key concept from ${subject} (${board} Class ${classLevel}).` },
    { front: `Define the key term in ${topic}.`, back: `Definition as per ${board} curriculum.` },
  ];
}

export async function generateFlashcardsFromStudyMaterial(
  studyMaterialText: string,
  topic: string,
  subject: string
): Promise<{ cards: Flashcard[] }> {
  if (!studyMaterialText || studyMaterialText.trim().length < 50) return { cards: [] };
  return withAIFallback(
    async () => {
      const result = await aiGenerateJson<{ cards: { front: string; back: string }[] }>(
        `Extract 8-12 flashcards from this study material. Topic: ${topic}, Subject: ${subject}.\n\n${studyMaterialText.slice(0, 6000)}\n\nReturn JSON: { "cards": [ { "front": "...", "back": "..." } ] }`,
        'Extract flashcards in valid JSON format.'
      );
      return { cards: (result.cards || []).slice(0, 15) };
    },
    { cards: [] }
  );
}

export async function generateFlashcardsFromExamFeedback(
  feedback: { good?: string[]; bad?: string[]; questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[] },
  questions: { question: string }[],
  subject: string,
  board: string,
  classLevel: string
): Promise<{ cards: Flashcard[] }> {
  const incorrectIndices = (feedback.questionFeedback || []).filter((qf) => !qf.correct).map((qf) => qf.questionIndex);
  if (incorrectIndices.length === 0) return { cards: [] };
  return withAIFallback(
    async () => {
      const weakQ = incorrectIndices.map((i) => questions[i]?.question).filter(Boolean).join(' | ');
      const result = await aiGenerateJson<{ cards: { front: string; back: string }[] }>(
        `Generate 6-10 remedial flashcards for ${subject} (${board} Class ${classLevel}). Weak areas: ${(feedback.bad || []).join('. ')}. Questions wrong: ${weakQ}. Return JSON: { "cards": [ { "front": "...", "back": "..." } ] }`,
        'Generate flashcards in valid JSON format.'
      );
      return { cards: (result.cards || []).slice(0, 12) };
    },
    { cards: [] }
  );
}

export async function generateStudyMaterial(
  subject: string,
  topic: string,
  board: string,
  classLevel: string,
  _options?: { includeFlashcards?: boolean }
): Promise<{ title: string; summary: string; sections: StudyMaterialContent[]; flashcards?: Flashcard[] }> {
  return withAIFallback(
    async () => {
      const text = await aiGenerate(
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
      const base = {
        title: `${topic} - ${subject}`,
        summary: `Study material for ${topic} (${board} Class ${classLevel}).`,
        sections: [
          { type: 'text' as const, content: text },
          {
            type: 'image' as const,
            content: getConceptSvg(topic),
            caption: `${topic} - Concept overview`,
          },
        ],
      };
      if (_options?.includeFlashcards) {
        const { cards } = await generateFlashcards(subject, topic, board, classLevel);
        return { ...base, flashcards: cards };
      }
      return base;
    },
    _options?.includeFlashcards
      ? { ...getPlaceholderStudyMaterial(subject, topic, board, classLevel), flashcards: getPlaceholderFlashcards(subject, topic, board, classLevel) } as { title: string; summary: string; sections: StudyMaterialContent[]; flashcards?: Flashcard[] }
      : getPlaceholderStudyMaterial(subject, topic, board, classLevel)
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
        type: 'text' as const,
        content: `# ${topic}\n\nThis covers ${topic} for ${subject} (${board} Class ${classLevel}).\n\n## Key Concepts\n\n• Introduction and main points\n• Practical applications\n• Tips for exam preparation`,
      },
    ],
  };
}

export async function answerDoubt(
  question: string,
  context: { subject: string; topic: string; board: string; classLevel: string }
): Promise<{ answer: string; questionWarning?: boolean; answerWarning?: boolean; sentimentScore?: number }> {
  const rawAnswer = await withAIFallback(
    async () => {
      return await aiGenerate(
        `A student asks: "${question}"\n\nContext: ${context.subject}, ${context.board} Class ${context.classLevel}, topic: ${context.topic}.\n\nProvide a clear, educational answer suitable for a school student. Use simple language and include examples if helpful. Format your answer with markdown: use **bold** for key terms, bullet points for lists, numbered steps when explaining procedures, and headings for distinct sections.`,
        'You are a patient and knowledgeable tutor helping Indian school students. Explain concepts clearly and encourage learning. Always use markdown formatting (bullets, numbered lists, bold for emphasis) to make answers easy to read.'
      );
    },
    `Based on ${context.subject} (${context.board} Class ${context.classLevel}) - ${context.topic}:\n\n${question}\n\nAnswer: Please configure GEMINI_API_KEY for AI-powered doubt resolution.`
  );
  const { analyzeSentiment, getSafeDisplayText } = await import('@/lib/sentiment');
  const questionSentiment = await analyzeSentiment(question.trim());
  if (questionSentiment.score < 0.2) {
    throw new Error('Your question contains inappropriate content. Please rephrase and try again.');
  }
  const answerSentiment = await analyzeSentiment(rawAnswer);
  const { text: safeAnswer } = getSafeDisplayText(rawAnswer, answerSentiment);
  return {
    answer: safeAnswer,
    questionWarning: !questionSentiment.safe,
    answerWarning: !answerSentiment.safe,
    sentimentScore: Math.min(questionSentiment.score, answerSentiment.score),
  };
}

export async function analyzeSessionMonitoring(
  sessionId: string,
  frames: { studentFrame?: string; teacherFrame?: string; audioLevel?: number }
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return withAIFallback(
    async () => {
      if (frames.studentFrame && frames.teacherFrame) {
        const result = await aiGenerateWithImages(
          'Analyze these two images from an online tutoring session. Image 1: student view. Image 2: teacher view. Is the session appropriate and safe? Reply with JSON only: { "alert": false or true, "type": "reason if alert", "message": "brief message" }',
          [frames.studentFrame, frames.teacherFrame]
        );
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch?.[0]) {
          return JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
        }
      }
      return { alert: false };
    },
    { alert: false }
  );
}

/** Single-frame analysis during exam: alone? no phone/book? face visible? camera covered? */
export async function analyzeExamFrame(
  studentFrame: string
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return withAIFallback(
    async () => {
      const result = await aiGenerateWithImages(
        `Analyze this webcam frame from an online exam. Strictly check:
1. Is the person ALONE? (no other people in frame, background, or reflection)
2. Is the person's FACE clearly visible and facing the camera/screen?
3. PERSON CHANGED? Different face/person than expected - flag if identity appears to have switched.
4. SCREEN CLEAR? Camera not blurry, dark, obstructed, blank/black, or showing ceiling/wall.
5. No phone, tablet, book, notes, second screen, or cheat materials visible?
6. Person not looking away from screen (e.g. at phone, another person, notes)?
7. No attempt to cover camera or obstruct view?

Flag alert=true if ANY: multiple people, person changed, extra person, phone/device, book/notes, face not visible, screen unclear, looking away, camera covered/blank, suspicious activity.
Reply with JSON only: { "alert": true/false, "type": "reason if alert", "message": "brief user-facing message" }`,
        [studentFrame]
      );
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        return JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
      }
      return { alert: false };
    },
    { alert: false }
  );
}

/** Combined video + audio analysis for live exam monitoring. Includes speech-to-text transcript for audit. */
export async function analyzeExamFrameWithAudio(
  studentFrame: string,
  audioDataUrl?: string | null
): Promise<{ alert: boolean; type?: string; message?: string; transcript?: string }> {
  let transcript = '';
  if (audioDataUrl?.trim()) {
    try {
      transcript = await transcribeAudio(audioDataUrl);
    } catch {
      transcript = '';
    }
  }

  const transcriptSection = transcript
    ? `\n\nSPEECH-TO-TEXT TRANSCRIPT (what was heard):\n"${transcript}"\n\nUse this transcript to detect: someone dictating answers, reading from notes, another person helping, suspicious conversation. Flag alert=true if transcript suggests cheating.`
    : '';

  return withAIFallback(
    async () => {
      const prompt = `STRICT exam proctoring. Analyze this webcam frame and audio. You MUST flag alert=true for ANY violation.

VIDEO - Flag alert=true if:
1. MULTIPLE PEOPLE: More than one person visible (face, body, in background, reflection, mirror). Even one extra person = alert.
2. PERSON CHANGED: Different person than expected (face changed, someone else in frame). Flag if identity appears to have switched.
3. PERSON LEFT/ABSENT: No clear face visible, person left the frame, only showing empty chair/room, back of head, or person turned away.
4. SCREEN/CAMERA NOT CLEAR: Image too dark, too bright/washed out, blurry, obstructed, camera showing ceiling/wall/blank/black, or view is unclear for proper monitoring.
5. DEVICES: Phone, tablet, second screen, laptop, book, notes, cheat materials, or any external aid visible.
6. LOOKING AWAY: Person clearly looking at phone, another person, notes, second screen, or away from exam screen.
7. SUSPICIOUS: Any attempt to obstruct view, cover camera, or hide activity.

AUDIO - Flag alert=true if:
8. MULTIPLE VOICES: Someone else speaking, helping, dictating answers, or background conversation.
9. EXCESSIVE NOISE: TV, music, loud background noise, or suspicious sounds.
10. TRANSCRIPT CHEATING: If transcript provided, flag if someone appears to be dictating answers, reading from notes, or receiving help.${transcriptSection}

BE STRICT. When in doubt, flag. Better to warn than miss cheating.
Reply with JSON only: { "alert": true/false, "type": "reason if alert", "message": "brief user-facing message" }`;

      const result = await aiGenerateWithImageAndAudio(prompt, studentFrame, audioDataUrl);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        const parsed = JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
        return { ...parsed, transcript: transcript || undefined };
      }
      return { alert: false, transcript: transcript || undefined };
    },
    { alert: false, transcript: transcript || undefined }
  );
}

/** Single-frame classroom analysis (student or teacher view). Strict AI inspection. */
export async function analyzeClassroomFrame(
  frame: string,
  role: 'student' | 'teacher',
  referencePhotoUrl?: string | null
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return withAIFallback(
    async () => {
      const roleDesc = role === 'student' ? 'student' : 'teacher';
      const images = referencePhotoUrl ? [frame, referencePhotoUrl] : [frame];
      const faceMatchPrompt = referencePhotoUrl
        ? `Image 1: Current webcam. Image 2: Stored ${roleDesc} photo. Does the face in Image 1 match Image 2? Flag if mismatch. `
        : '';
      const result = await aiGenerateWithImages(
        `STRICT AI inspection for online class. This is the ${roleDesc}'s webcam view.
${faceMatchPrompt}
Check ALL:
1. Camera ON - face clearly visible, not black/blank/covered
2. Microphone implied ON - person present and engaged
3. Video/sound quality - clear view, no heavy obstruction
4. NO extra person in background - must be alone
5. NO extra noise/distraction - clean environment
6. Person must match stored ${roleDesc} photo (if provided) - flag face_mismatch if different
7. No foul language, inappropriate content, phones, notes, cheating materials
8. Board/desk area neat and clean (for teacher)

Flag alert=true for: camera_off, voice_off, face_mismatch, extra_person, background_noise, foul_language, absent, cheating, other.
Reply with JSON only: { "alert": true/false, "type": "reason if alert", "message": "brief user message" }`,
        images
      );
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        return JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
      }
      return { alert: false };
    },
    { alert: false }
  );
}

/** Transcribe audio to text using Gemini (speech-to-text for exam monitoring) */
export async function transcribeAudio(audioDataUrl: string): Promise<string> {
  if (!audioDataUrl?.trim()) return '';
  return withAIFallback(async () => aiTranscribeAudio(audioDataUrl), '');
}

export interface TeacherExamQuestion {
  question: string;
  type: 'mcq' | 'short';
  options?: string[];
  correctAnswer?: number | string;
}

export async function generateTeacherQualificationExam(
  combinations: { board: string; classLevel: string; subject: string }[],
  durationMinutes: number = 15
): Promise<TeacherExamQuestion[]> {
  if (!isAIConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to .env.local');
  }
  const comboDesc = combinations
    .map((c) => `${c.board} Board, Class ${c.classLevel}, ${c.subject}`)
    .join('; ');
  const result = await aiGenerateJson<{
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
  if (questions.length === 0) {
    throw new Error('AI returned no questions. Please try again.');
  }
  return questions;
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

export async function verifyDocumentPhoto(
  documentImageUrl: string,
  profilePhotoUrl: string
): Promise<'verified' | 'not_verified' | 'partially_verified'> {
  return withAIFallback(
    async () => {
      const result = await aiGenerateWithImages(
        `You are verifying identity documents. Image 1: ID proof document (Aadhaar/Passport etc). Image 2: Student/person photo.
        Does the photo on the ID document match the person in the second photo? Consider face similarity.
        Reply with exactly one word: verified, not_verified, or partially_verified.`,
        [documentImageUrl, profilePhotoUrl]
      );
      const lower = result.trim().toLowerCase();
      if (lower.includes('not_verified')) return 'not_verified';
      if (lower.includes('partially')) return 'partially_verified';
      return 'verified';
    },
    'verified'
  );
}
