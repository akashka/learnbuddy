import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { analyzeExamFrameWithAudio } from '@/lib/ai';
import { getAuthFromRequest } from '@/lib/auth';
import { logAIUsage } from '@/lib/ai-audit';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { examId, frame, audio } = body;

    if (!examId || !frame) {
      return NextResponse.json({ error: 'examId and frame (base64 data URL) required' }, { status: 400 });
    }

    const exam = await StudentExam.findOne({ _id: examId, studentId: student._id });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    if (exam.status !== 'in_progress') {
      return NextResponse.json({ error: 'Exam not in progress' }, { status: 400 });
    }

    const start = Date.now();
    let result: { alert?: boolean; type?: string; message?: string };
    try {
      result = await analyzeExamFrameWithAudio(frame, audio || null);
    } catch (err) {
      await logAIUsage({
        operationType: 'analyze_exam_frame_with_audio',
        userId: decoded.userId,
        userRole: 'student',
        entityId: examId,
        entityType: 'exam',
        inputMetadata: { hasAudio: !!audio },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'analyze_exam_frame_with_audio',
      userId: decoded.userId,
      userRole: 'student',
      entityId: examId,
      entityType: 'exam',
      inputMetadata: { hasAudio: !!audio },
      outputMetadata: { alert: result.alert, type: result.type },
      durationMs: Date.now() - start,
      success: true,
    });

    const resultWithTranscript = result as {
      transcript?: string;
      transcriptDisplay?: string;
      transcriptWarning?: boolean;
    };
    const transcriptToStore = resultWithTranscript.transcriptWarning && resultWithTranscript.transcriptDisplay
      ? resultWithTranscript.transcriptDisplay
      : resultWithTranscript.transcript;
    const pushOps: Record<string, unknown> = {};
    if (result.alert) {
      pushOps.monitoringAlerts = {
        type: result.type || 'suspicious',
        message: result.message || result.type || 'Suspicious activity detected',
        timestamp: new Date(),
        transcript: transcriptToStore,
      };
    }
    if (transcriptToStore) {
      pushOps.monitoringTranscripts = {
        transcript: transcriptToStore,
        timestamp: new Date(),
      };
    }
    if (Object.keys(pushOps).length > 0) {
      await StudentExam.findByIdAndUpdate(examId, {
        ...(result.alert && { $inc: { warnings: 1 } }),
        $push: pushOps,
      });
    }

    const respTranscript = resultWithTranscript.transcriptDisplay ?? resultWithTranscript.transcript;
    return NextResponse.json({
      alert: result.alert,
      type: result.type,
      message: result.message,
      transcript: respTranscript,
      transcriptWarning: resultWithTranscript.transcriptWarning,
      warnings: (exam.warnings || 0) + (result.alert ? 1 : 0),
    });
  } catch (error) {
    console.error('Exam monitor error:', error);
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}
