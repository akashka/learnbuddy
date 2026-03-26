import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { ClassroomWarning } from '@/lib/models/ClassroomWarning';
import { AIAlert } from '@/lib/models/AIAlert';
import { createNotification, createNotificationsForUsers } from '@/lib/notification-service';
import { getAuthFromRequest } from '@/lib/auth';
import { emitWarning } from '@/lib/socket';

/**
 * POST /api/classroom/session/warning
 * Issues a warning to teacher or student – handles escalation:
 *   1-3: toast to offending person only
 *   4: notify opposite side + parent
 *   5+: notify admin
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = (await request.json()) as { sessionId: string; targetRole: 'student' | 'teacher'; reason: string };
    const { sessionId, targetRole, reason } = body;
    if (!sessionId || !targetRole || !reason) {
      return NextResponse.json({ error: 'sessionId, targetRole, reason required' }, { status: 400 });
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session not in progress' }, { status: 400 });
    }

    // Increment warning count
    const countField = targetRole === 'student' ? 'warningCounts.student' : 'warningCounts.teacher';
    await ClassSession.findByIdAndUpdate(sessionId, { $inc: { [countField]: 1 } });

    const updatedSession = await ClassSession.findById(sessionId).lean();
    const counts = updatedSession?.warningCounts || { teacher: 0, student: 0 };
    const level = targetRole === 'student' ? counts.student : counts.teacher;

    // Create warning record
    const notifiedParent = level >= 4;
    const notifiedAdmin = level >= 5;
    await ClassroomWarning.create({
      sessionId,
      targetRole,
      level,
      reason,
      notifiedParent,
      notifiedAdmin,
    });

    // Emit real-time warning to classroom
    emitWarning(sessionId, { level, reason, targetRole });

    // Level 4+: Notify opposite side + parent
    if (level >= 4) {
      // Notify parent(s)
      if (session.parentIds?.length) {
        for (const parentId of session.parentIds) {
          const parent = await Parent.findById(parentId).select('userId').lean();
          if (parent?.userId) {
            await createNotification({
              userId: parent.userId,
              type: 'classroom_warning',
              title: '⚠️ Classroom Warning',
              message: `Warning #${level} for ${targetRole}: ${reason}`,
              entityType: 'class',
              entityId: sessionId,
              ctaLabel: 'View Details',
              ctaUrl: `/parent/classes`,
            });
          }
        }
      }

      // Also notify the opposite party (teacher if targeting student, vice versa)
      if (targetRole === 'student') {
        const teacher = await Teacher.findById(session.teacherId).select('userId').lean();
        if (teacher?.userId) {
          await createNotification({
            userId: teacher.userId,
            type: 'classroom_warning',
            title: '⚠️ Student Behaviour Alert',
            message: `Warning #${level}: ${reason}`,
            entityType: 'class',
            entityId: sessionId,
          });
        }
      } else {
        // Student warning to teacher – notify student
        const studentId = session.studentId || session.studentIds?.[0];
        if (studentId) {
          const student = await Student.findById(studentId).select('userId').lean();
          if (student?.userId) {
            await createNotification({
              userId: student.userId,
              type: 'classroom_warning',
              title: '⚠️ Teacher Behaviour Alert',
              message: `Warning #${level}: ${reason}`,
              entityType: 'class',
              entityId: sessionId,
            });
          }
        }
      }
    }

    // Level 5+: Create critical AIAlert for admin
    if (level >= 5) {
      await AIAlert.create({
        sessionId,
        type: 'other',
        severity: 'critical',
        message: `ADMIN ALERT: Warning #${level} for ${targetRole} – ${reason}. Immediate action required.`,
        userId: session.teacherId,
        userRole: targetRole,
      });
    }

    return NextResponse.json({ level, notifiedParent, notifiedAdmin });
  } catch (error) {
    console.error('Warning API error:', error);
    return NextResponse.json({ error: 'Failed to issue warning' }, { status: 500 });
  }
}

/**
 * GET /api/classroom/session/warning?sessionId=...
 * Get all warnings for a session
 */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const warnings = await ClassroomWarning.find({ sessionId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ warnings });
  } catch (error) {
    console.error('Get warnings error:', error);
    return NextResponse.json({ error: 'Failed to get warnings' }, { status: 500 });
  }
}
