import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { ClassSession } from '@/lib/models/ClassSession';
import { AIAlert } from '@/lib/models/AIAlert';
import { analyzeClassroomFrame } from '@/lib/ai';
import { getAuthFromRequest } from '@/lib/auth';
import { logAIUsage } from '@/lib/ai-audit';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { sessionId, frame, role } = body;

    if (!sessionId || !frame || !role) {
      return NextResponse.json({ error: 'sessionId, frame (base64 data URL), and role required' }, { status: 400 });
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    let referencePhotoUrl: string | null = null;
    if (decoded.role === 'student') {
      const student = await Student.findOne({ userId: decoded.userId }).select('photoUrl').lean();
      const isInSession = student && (
        session.studentId?.equals(student._id) ||
        (session.studentIds?.length && session.studentIds.some((id) => String(id) === String(student._id)))
      );
      if (!isInSession) {
        return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      }
      referencePhotoUrl = student?.photoUrl || null;
    } else {
      const teacher = await Teacher.findOne({ userId: decoded.userId }).select('photoUrl').lean();
      if (!teacher || !session.teacherId?.equals(teacher._id)) {
        return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      }
      referencePhotoUrl = teacher?.photoUrl || null;
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session not in progress' }, { status: 400 });
    }

    const start = Date.now();
    let result: { alert?: boolean; type?: string; message?: string };
    try {
      result = await analyzeClassroomFrame(frame, role as 'student' | 'teacher', referencePhotoUrl);
    } catch (err) {
      await logAIUsage({
        operationType: 'analyze_classroom_frame',
        userId: decoded.userId,
        userRole: decoded.role,
        entityId: sessionId,
        entityType: 'class_session',
        inputMetadata: { sessionId, role },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'analyze_classroom_frame',
      userId: decoded.userId,
      userRole: decoded.role,
      entityId: sessionId,
      entityType: 'class_session',
      inputMetadata: { sessionId, role },
      outputMetadata: { alert: result.alert, type: result.type },
      durationMs: Date.now() - start,
      success: true,
    });

    if (result.alert) {
      const validTypes = ['face_mismatch', 'camera_off', 'voice_off', 'absent', 'background_noise', 'extra_person', 'foul_language', 'other'] as const;
      const alertType = (result.type && validTypes.includes(result.type as typeof validTypes[number])) ? result.type : 'other';
      const alertEntry = {
        type: alertType,
        severity: 'warning' as const,
        message: result.message || result.type || 'Suspicious activity',
        timestamp: new Date(),
      };
      await ClassSession.findByIdAndUpdate(sessionId, {
        $push: { aiMonitoringAlerts: alertEntry },
      });
      const student = decoded.role === 'student' ? await Student.findOne({ userId: decoded.userId }) : null;
      const teacher = decoded.role === 'teacher' ? await Teacher.findOne({ userId: decoded.userId }) : null;
      const userId = student?._id ?? teacher?._id;
      await AIAlert.create({
        sessionId,
        type: alertType,
        severity: alertEntry.severity,
        message: alertEntry.message,
        userId: userId ?? session.studentId,
        userRole: decoded.role as 'student' | 'teacher',
      });
    }

    return NextResponse.json({
      alert: result.alert,
      type: result.type,
      message: result.message,
    });
  } catch (error) {
    console.error('Classroom monitor error:', error);
    return NextResponse.json({ error: 'Failed to analyze frame' }, { status: 500 });
  }
}
