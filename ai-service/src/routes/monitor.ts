/**
 * Monitoring routes - classroom and exam
 */
import { Router } from 'express';
import {
  analyzeSessionMonitoring,
  analyzeExamFrameWithAudio,
  analyzeClassroomFrame,
  verifyDocumentPhoto,
  transcribeAudio,
} from '../services/monitoring.js';

const router = Router();

/** POST /v1/monitor/classroom - Single frame or session monitoring */
router.post('/classroom', async (req, res) => {
  try {
    const { frame, role, referencePhotoUrl, sessionId, studentFrame, teacherFrame } = req.body;

    // Session monitoring (student + teacher frames)
    if (sessionId && (studentFrame || teacherFrame)) {
      const result = await analyzeSessionMonitoring(sessionId, {
        studentFrame,
        teacherFrame,
      });
      res.json(result);
      return;
    }

    // Single frame classroom analysis
    if (!frame || !role) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Either (frame, role) or (sessionId, studentFrame, teacherFrame) required',
      });
      return;
    }

    if (role !== 'student' && role !== 'teacher') {
      res.status(400).json({
        error: 'Bad request',
        message: 'role must be "student" or "teacher"',
      });
      return;
    }

    const result = await analyzeClassroomFrame(frame, role, referencePhotoUrl ?? null);
    res.json(result);
  } catch (err) {
    console.error('analyzeClassroomFrame error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to analyze classroom',
    });
  }
});

/** POST /v1/monitor/exam - Exam proctoring (video + optional audio) */
router.post('/exam', async (req, res) => {
  try {
    const { studentFrame, audioDataUrl } = req.body;

    if (!studentFrame) {
      res.status(400).json({
        error: 'Bad request',
        message: 'studentFrame is required',
      });
      return;
    }

    const result = await analyzeExamFrameWithAudio(
      studentFrame,
      audioDataUrl ?? null
    );
    res.json(result);
  } catch (err) {
    console.error('analyzeExamFrame error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to analyze exam frame',
    });
  }
});

/** POST /v1/monitor/transcribe - Speech-to-text for exam monitoring */
router.post('/transcribe', async (req, res) => {
  try {
    const { audioDataUrl } = req.body;
    if (!audioDataUrl) {
      res.status(400).json({
        error: 'Bad request',
        message: 'audioDataUrl is required',
      });
      return;
    }
    const transcript = await transcribeAudio(audioDataUrl);
    res.json({ transcript });
  } catch (err) {
    console.error('transcribeAudio error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to transcribe audio',
    });
  }
});

/** POST /v1/monitor/verify-document - Verify document photo matches profile */
router.post('/verify-document', async (req, res) => {
  try {
    const { documentImageUrl, profilePhotoUrl } = req.body;
    if (!documentImageUrl || !profilePhotoUrl) {
      res.status(400).json({
        error: 'Bad request',
        message: 'documentImageUrl and profilePhotoUrl are required',
      });
      return;
    }
    const result = await verifyDocumentPhoto(documentImageUrl, profilePhotoUrl);
    res.json({ result });
  } catch (err) {
    console.error('verifyDocumentPhoto error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Failed to verify document',
    });
  }
});


export default router;
