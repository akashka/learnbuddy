/**
 * Generation routes
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import {
  generateQualificationExam,
  generateStudentExamQuestions,
  generateStudyMaterial,
  generateTeacherQualificationExam,
  generateFlashcards,
  generateFlashcardsFromStudyMaterial,
  generateFlashcardsFromExamFeedback,
  mapLegacyExamMode,
} from '../services/generation.js';
import type { ExamType } from '../services/types.js';

const router = Router();

/** POST /v1/generate/qualification-exam - Teacher qualification exam (5 MCQs) */
router.post('/qualification-exam', async (req: Request, res: Response) => {
  try {
    const { subject, board, classLevel } = req.body;
    if (!subject || !board || !classLevel) {
      res.status(400).json({
        error: 'Bad request',
        message: 'subject, board, and classLevel are required',
      });
      return;
    }
    const questions = await generateQualificationExam(subject, board, classLevel);
    res.json({ questions });
  } catch (err) {
    console.error('generateQualificationExam error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate exam',
    });
  }
});

/** POST /v1/generate/student-exam - Student exam questions */
router.post('/student-exam', async (req: Request, res: Response) => {
  try {
    const { subject, board, classLevel, examType, examMode, topics, answerInputType } = req.body;
    if (!subject || !board || !classLevel) {
      res.status(400).json({
        error: 'Bad request',
        message: 'subject, board, and classLevel are required',
      });
      return;
    }
    const resolvedExamType: ExamType = mapLegacyExamMode(examMode || 'class_test', examType);
    const mode = answerInputType === 'photo' || answerInputType === 'audio' ? answerInputType : 'typed';
    const result = await generateStudentExamQuestions(
      subject,
      board,
      classLevel,
      resolvedExamType,
      Array.isArray(topics) ? topics : undefined,
      mode
    );
    res.json(result);
  } catch (err) {
    console.error('generateStudentExamQuestions error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate exam',
    });
  }
});

/** POST /v1/generate/study-material */
router.post('/study-material', async (req, res) => {
  try {
    const { subject, topic, board, classLevel, includeFlashcards } = req.body;
    if (!subject || !topic || !board || !classLevel) {
      res.status(400).json({
        error: 'Bad request',
        message: 'subject, topic, board, and classLevel are required',
      });
      return;
    }
    const result = await generateStudyMaterial(subject, topic, board, classLevel, {
      includeFlashcards: !!includeFlashcards,
    });
    res.json(result);
  } catch (err) {
    console.error('generateStudyMaterial error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate study material',
    });
  }
});

/** POST /v1/generate/flashcards - Option A: Standalone flashcard generation */
router.post('/flashcards', async (req, res) => {
  try {
    const { subject, topic, board, classLevel } = req.body;
    if (!subject || !topic || !board || !classLevel) {
      res.status(400).json({
        error: 'Bad request',
        message: 'subject, topic, board, and classLevel are required',
      });
      return;
    }
    const result = await generateFlashcards(subject, topic, board, classLevel);
    res.json(result);
  } catch (err) {
    console.error('generateFlashcards error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate flashcards',
    });
  }
});

/** POST /v1/generate/flashcards-from-material - Option C: From study material text */
router.post('/flashcards-from-material', async (req, res) => {
  try {
    const { studyMaterialText, topic, subject } = req.body;
    if (!studyMaterialText || !topic || !subject) {
      res.status(400).json({
        error: 'Bad request',
        message: 'studyMaterialText, topic, and subject are required',
      });
      return;
    }
    const result = await generateFlashcardsFromStudyMaterial(studyMaterialText, topic, subject);
    res.json(result);
  } catch (err) {
    console.error('generateFlashcardsFromStudyMaterial error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate flashcards from material',
    });
  }
});

/** POST /v1/generate/flashcards-from-exam - Option D: From exam feedback */
router.post('/flashcards-from-exam', async (req, res) => {
  try {
    const { feedback, questions, subject, board, classLevel } = req.body;
    if (!feedback || !questions || !subject || !board || !classLevel) {
      res.status(400).json({
        error: 'Bad request',
        message: 'feedback, questions, subject, board, and classLevel are required',
      });
      return;
    }
    const result = await generateFlashcardsFromExamFeedback(
      feedback,
      questions,
      subject,
      board,
      classLevel
    );
    res.json(result);
  } catch (err) {
    console.error('generateFlashcardsFromExamFeedback error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate flashcards from exam',
    });
  }
});

/** POST /v1/generate/teacher-qualification-exam - Full teacher qualification (15 questions) */
router.post('/teacher-qualification-exam', async (req: Request, res: Response) => {
  try {
    const { combinations, durationMinutes } = req.body;
    if (!combinations || !Array.isArray(combinations) || combinations.length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'combinations array is required (each: { board, classLevel, subject })',
      });
      return;
    }
    const questions = await generateTeacherQualificationExam(
      combinations,
      durationMinutes ?? 15
    );
    res.json({ questions });
  } catch (err) {
    console.error('generateTeacherQualificationExam error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to generate teacher exam',
    });
  }
});

export default router;
