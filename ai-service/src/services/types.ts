/**
 * Shared types for AI services
 */

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
  /** True when answer text was masked due to low sentiment */
  sentimentWarning?: boolean;
}

export interface StudyMaterialContent {
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  caption?: string;
}

export interface TeacherExamQuestion {
  question: string;
  type: 'mcq' | 'short';
  options?: string[];
  correctAnswer?: number | string;
}
