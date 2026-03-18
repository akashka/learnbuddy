/**
 * Doubt answering route
 */
import { Router } from 'express';
import { answerDoubt } from '../services/doubt.js';

const router = Router();

/** POST /v1/doubt/ask */
router.post('/ask', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: 'Bad request',
        message: 'question (string) is required',
      });
      return;
    }

    if (!context || typeof context !== 'object') {
      res.status(400).json({
        error: 'Bad request',
        message: 'context object is required: { subject, topic, board, classLevel }',
      });
      return;
    }

    const { subject, topic, board, classLevel } = context;
    if (!subject || !topic || !board || !classLevel) {
      res.status(400).json({
        error: 'Bad request',
        message: 'context must include subject, topic, board, classLevel',
      });
      return;
    }

    const result = await answerDoubt(question, { subject, topic, board, classLevel });
    res.json({
      answer: result.answer,
      questionWarning: result.questionWarning,
      answerWarning: result.answerWarning,
      sentimentScore: result.sentimentScore,
    });
  } catch (err) {
    console.error('answerDoubt error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to answer doubt',
    });
  }
});

export default router;
