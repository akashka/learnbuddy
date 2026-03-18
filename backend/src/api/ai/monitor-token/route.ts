import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { ClassSession } from '@/lib/models/ClassSession';
import { StudentExam } from '@/lib/models/StudentExam';
import jwt from 'jsonwebtoken';
import { getAuthFromRequest } from '@/lib/auth';

const AI_MONITOR_JWT_SECRET = process.env.AI_MONITOR_JWT_SECRET || process.env.JWT_SECRET;
const MONITOR_TOKEN_EXPIRY = '2h';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, sessionId, examId } = body;

    if (!type || (type !== 'classroom' && type !== 'exam')) {
      return NextResponse.json({ error: 'type must be "classroom" or "exam"' }, { status: 400 });
    }

    await connectDB();

    if (type === 'classroom') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId required for classroom' }, { status: 400 });
      }
      const session = await ClassSession.findById(sessionId);
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      if (decoded.role === 'student') {
        const student = await Student.findOne({ userId: decoded.userId });
        const isInSession =
          student &&
          (session.studentId?.equals(student._id) ||
            (session.studentIds?.length && session.studentIds.some((id: unknown) => String(id) === String(student._id))));
        if (!isInSession) return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      } else if (decoded.role === 'teacher') {
        const teacher = await Teacher.findOne({ userId: decoded.userId });
        if (!teacher || !session.teacherId?.equals(teacher._id)) {
          return NextResponse.json({ error: 'Not your session' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Only student or teacher can get monitor token' }, { status: 403 });
      }

      const monitorPayload = {
        type: 'classroom',
        sessionId,
        role: decoded.role,
        userId: decoded.userId,
      };
      const monitorToken = jwt.sign(monitorPayload, AI_MONITOR_JWT_SECRET!, { expiresIn: MONITOR_TOKEN_EXPIRY });

      return NextResponse.json({ token: monitorToken, expiresIn: MONITOR_TOKEN_EXPIRY });
    }

    if (type === 'exam') {
      if (!examId) {
        return NextResponse.json({ error: 'examId required for exam' }, { status: 400 });
      }
      if (decoded.role !== 'student') {
        return NextResponse.json({ error: 'Only students can get exam monitor token' }, { status: 403 });
      }

      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const exam = await StudentExam.findOne({ _id: examId, studentId: student._id });
      if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

      const monitorPayload = {
        type: 'exam',
        examId,
        studentId: student._id.toString(),
        userId: decoded.userId,
      };
      const monitorToken = jwt.sign(monitorPayload, AI_MONITOR_JWT_SECRET!, { expiresIn: MONITOR_TOKEN_EXPIRY });

      return NextResponse.json({ token: monitorToken, expiresIn: MONITOR_TOKEN_EXPIRY });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Monitor token error:', error);
    return NextResponse.json({ error: 'Failed to issue token' }, { status: 500 });
  }
}
