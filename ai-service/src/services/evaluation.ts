/**
 * AI Service - Exam evaluation
 */
import {
  aiGenerate,
  aiGenerateJson,
  aiGenerateWithImages,
  aiTranscribeAudio,
} from '../providers/unified.js';
import { withGeminiFallback } from './utils.js';
import { analyzeSentimentBatch, getSafeDisplayText } from './sentiment.js';
import type { StudentExamQuestion, TeacherExamQuestion } from './types.js';
import type { QuestionResultDetail } from './types.js';

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
      const transcribed = await withGeminiFallback(() => aiTranscribeAudio(parts.audioDataUrl!), '');
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
      const aiEval = await withGeminiFallback(
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
      const aiEval = await withGeminiFallback(
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

  // Sentiment check for text answers - mask inappropriate content in display
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
    const sentimentResults = await analyzeSentimentBatch(textAnswers);
    sentimentResults.forEach((res, idx) => {
      const detailIdx = textAnswerIndices[idx];
      const orig = String(questionDetails[detailIdx].userAnswer);
      const { text: safeText } = getSafeDisplayText(orig, res);
      if (!res.safe) {
        questionDetails[detailIdx] = {
          ...questionDetails[detailIdx],
          userAnswer: safeText,
          sentimentWarning: true,
        };
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

  const aiOverall = await withGeminiFallback(
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
