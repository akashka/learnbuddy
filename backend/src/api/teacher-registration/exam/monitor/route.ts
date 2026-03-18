import { NextRequest, NextResponse } from '@/lib/next-compat';
import { analyzeExamFrame } from '@/lib/ai';
import { verifyTeacherRegistrationSession } from '@/lib/teacher-registration-session';
import { logAIUsage } from '@/lib/ai-audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, frame } = body;

    if (!phone || !frame) {
      return NextResponse.json({ error: 'phone and frame (base64 data URL) required' }, { status: 400 });
    }

    if (!verifyTeacherRegistrationSession(request, phone)) {
      return NextResponse.json({ error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    const start = Date.now();
    let result: { alert?: boolean; type?: string; message?: string };
    try {
      result = await analyzeExamFrame(frame);
    } catch (err) {
      await logAIUsage({
        operationType: 'analyze_exam_frame',
        entityType: 'teacher_registration',
        inputMetadata: {},
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'analyze_exam_frame',
      entityType: 'teacher_registration',
      inputMetadata: {},
      outputMetadata: { alert: result.alert, type: result.type },
      durationMs: Date.now() - start,
      success: true,
    });

    return NextResponse.json({
      alert: result.alert,
      type: result.type,
      message: result.message,
    });
  } catch (error) {
    console.error('Teacher exam monitor error:', error);
    return NextResponse.json({ error: 'Failed to analyze frame' }, { status: 500 });
  }
}
