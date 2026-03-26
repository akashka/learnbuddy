/**
 * AI facade - uses AI service when AI_SERVICE_URL is set, else local ai-service
 */
import * as aiClient from './ai-client.js';
import * as aiService from './ai-service.js';

const USE_AI_SERVICE = !!process.env.AI_SERVICE_URL && !!process.env.AI_SERVICE_API_KEY;

export type ExamType = 'quick_test' | 'class_test' | 'preparatory';
export type StudentExamQuestion = aiClient.StudentExamQuestion;
export type TeacherExamQuestion = aiClient.TeacherExamQuestion;

export const getExamFormat = aiClient.getExamFormat;
export const mapLegacyExamMode = aiClient.mapLegacyExamMode;

export async function generateQualificationExam(
  subject: string,
  board: string,
  classLevel: string
) {
  return USE_AI_SERVICE
    ? aiClient.generateQualificationExam(subject, board, classLevel)
    : aiService.generateQualificationExam(subject, board, classLevel);
}

export async function generateStudentExamQuestions(
  subject: string,
  board: string,
  classLevel: string,
  examType: ExamType,
  topics?: string[],
  answerInputType?: 'typed' | 'photo' | 'audio'
) {
  return USE_AI_SERVICE
    ? aiClient.generateStudentExamQuestions(subject, board, classLevel, examType, topics, answerInputType)
    : aiService.generateStudentExamQuestions(subject, board, classLevel, examType, topics, answerInputType);
}

export async function generateStudyMaterial(
  subject: string,
  topic: string,
  board: string,
  classLevel: string,
  options?: { includeFlashcards?: boolean }
) {
  return USE_AI_SERVICE
    ? aiClient.generateStudyMaterial(subject, topic, board, classLevel, options)
    : aiService.generateStudyMaterial(subject, topic, board, classLevel, options);
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  board: string,
  classLevel: string
) {
  return USE_AI_SERVICE
    ? aiClient.generateFlashcards(subject, topic, board, classLevel)
    : aiService.generateFlashcards(subject, topic, board, classLevel);
}

export async function generateFlashcardsFromStudyMaterial(
  studyMaterialText: string,
  topic: string,
  subject: string
) {
  return USE_AI_SERVICE
    ? aiClient.generateFlashcardsFromStudyMaterial(studyMaterialText, topic, subject)
    : aiService.generateFlashcardsFromStudyMaterial(studyMaterialText, topic, subject);
}

export async function generateFlashcardsFromExamFeedback(
  feedback: { good?: string[]; bad?: string[]; overall?: string; questionFeedback?: { questionIndex: number; correct: boolean; feedback: string }[] },
  questions: { question: string; type?: string }[],
  subject: string,
  board: string,
  classLevel: string
) {
  return USE_AI_SERVICE
    ? aiClient.generateFlashcardsFromExamFeedback(feedback, questions, subject, board, classLevel)
    : aiService.generateFlashcardsFromExamFeedback(feedback, questions, subject, board, classLevel);
}

export async function generateTeacherQualificationExam(
  combinations: { board: string; classLevel: string; subject: string }[],
  durationMinutes?: number
) {
  return USE_AI_SERVICE
    ? aiClient.generateTeacherQualificationExam(combinations, durationMinutes)
    : aiService.generateTeacherQualificationExam(combinations, durationMinutes);
}

export async function evaluateStudentExam(
  questions: StudentExamQuestion[],
  answers: (number | string | { value?: number | string; photoUrl?: string; audioTranscript?: string })[]
) {
  return USE_AI_SERVICE
    ? aiClient.evaluateStudentExam(questions, answers)
    : aiService.evaluateStudentExam(questions, answers);
}

export function evaluateTeacherExam(
  questions: TeacherExamQuestion[],
  answers: (number | string)[]
) {
  return USE_AI_SERVICE
    ? aiClient.evaluateTeacherExam(questions, answers)
    : aiService.evaluateTeacherExam(questions, answers);
}

export async function analyzeClassroomFrame(
  frame: string,
  role: 'student' | 'teacher',
  referencePhotoUrl?: string | null
) {
  return USE_AI_SERVICE
    ? aiClient.analyzeClassroomFrame(frame, role, referencePhotoUrl)
    : aiService.analyzeClassroomFrame(frame, role, referencePhotoUrl);
}

export async function analyzeExamFrame(studentFrame: string) {
  return USE_AI_SERVICE
    ? aiClient.analyzeExamFrame(studentFrame)
    : aiService.analyzeExamFrame(studentFrame);
}

export async function analyzeExamFrameWithAudio(
  studentFrame: string,
  audioDataUrl?: string | null
) {
  return USE_AI_SERVICE
    ? aiClient.analyzeExamFrameWithAudio(studentFrame, audioDataUrl)
    : aiService.analyzeExamFrameWithAudio(studentFrame, audioDataUrl);
}

export async function answerDoubt(
  question: string,
  context: { subject: string; topic: string; board: string; classLevel: string }
) {
  return USE_AI_SERVICE
    ? aiClient.answerDoubt(question, context)
    : aiService.answerDoubt(question, context);
}

export async function verifyDocumentPhoto(
  documentImageUrl: string,
  profilePhotoUrl: string
) {
  return USE_AI_SERVICE
    ? aiClient.verifyDocumentPhoto(documentImageUrl, profilePhotoUrl)
    : aiService.verifyDocumentPhoto(documentImageUrl, profilePhotoUrl);
}
