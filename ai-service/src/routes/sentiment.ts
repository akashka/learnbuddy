/**
 * Sentiment analysis route
 */
import { Router } from 'express';
import { analyzeSentiment, analyzeSentimentBatch } from '../services/sentiment.js';

const router = Router();

/** POST /v1/sentiment/analyze - Single text */
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({
        error: 'Bad request',
        message: 'text (string) is required',
      });
      return;
    }
    const result = await analyzeSentiment(text);
    res.json(result);
  } catch (err) {
    console.error('analyzeSentiment error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to analyze sentiment',
    });
  }
});

/** POST /v1/sentiment/batch - Multiple texts */
router.post('/batch', async (req, res) => {
  try {
    const { texts } = req.body;
    if (!texts || !Array.isArray(texts)) {
      res.status(400).json({
        error: 'Bad request',
        message: 'texts (array of strings) is required',
      });
      return;
    }
    const results = await analyzeSentimentBatch(texts.map(String));
    res.json({ results });
  } catch (err) {
    console.error('analyzeSentimentBatch error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to analyze sentiment',
    });
  }
});

export default router;
