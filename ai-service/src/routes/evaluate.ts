/**
 * Evaluation routes
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import { evaluateStudentExam, evaluateTeacherExam } from '../services/evaluation.js';
import type { StudentExamQuestion, TeacherExamQuestion } from '../services/types.js';

const router = Router();

/** POST /v1/evaluate/exam - Student exam evaluation */
router.post('/exam', async (req: Request, res: Response) => {
  try {
    const { questions, answers, type } = req.body;

    if (!questions || !Array.isArray(questions)) {
      res.status(400).json({
        error: 'Bad request',
        message: 'questions array is required',
      });
      return;
    }

    if (type === 'teacher') {
      // Teacher qualification exam - simple scoring
      const teacherQuestions = questions as TeacherExamQuestion[];
      const teacherAnswers = (answers ?? []) as (number | string)[];
      const result = evaluateTeacherExam(teacherQuestions, teacherAnswers);
      res.json(result);
      return;
    }

    // Student exam - AI-powered evaluation
    const studentQuestions = questions as StudentExamQuestion[];
    const studentAnswers = (answers ?? []) as (number | string | { value?: number | string })[];
    const result = await evaluateStudentExam(studentQuestions, studentAnswers);
    res.json(result);
  } catch (err) {
    console.error('evaluateStudentExam error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to evaluate exam',
    });
  }
});

export default router;
