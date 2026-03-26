import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';
import type { EnrollmentClosureType } from '@/lib/models/Teacher';

function isEnrollmentOpen(
  batch: { enrollmentOpen?: boolean; enrollmentClosureType?: EnrollmentClosureType; startDate?: Date; maxStudents?: number },
  enrolledCount: number
): boolean {
  if (batch.enrollmentOpen === false) return false;
  const type = batch.enrollmentClosureType || 'teacher_only';
  if (type === 'one_week_after_start' && batch.startDate) {
    const weekAfter = new Date(batch.startDate);
    weekAfter.setDate(weekAfter.getDate() + 7);
    if (new Date() >= weekAfter) return false;
  }
  if (type === 'max_students_reached') {
    const max = batch.maxStudents ?? 3;
    if (enrolledCount >= max) return false;
  }
  return true;
}

/** Batch start date: min = tomorrow, max = 30 days from today */
function validateBatchStartDate(date: Date): { valid: boolean; error?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d < minDate) return { valid: false, error: 'Batch start date must be at least tomorrow' };
  if (d > maxDate) return { valid: false, error: 'Batch start date must be within 30 days from today' };
  return { valid: true };
}

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const batches = teacher.batches || [];
    const teacherId = teacher._id;

    const batchesWithCount = await Promise.all(
      batches.map(async (b: { name?: string; board?: string; classLevel?: string; subject?: string; enrollmentOpen?: boolean; enrollmentClosureType?: EnrollmentClosureType; startDate?: Date; maxStudents?: number }) => {
        const enrolledCount = await Enrollment.countDocuments({
          teacherId,
          batchId: b.name || '',
          status: { $in: ['active', 'completed'] },
        });
        const open = isEnrollmentOpen(b, enrolledCount);
        return { ...b, enrolledCount, isEnrollmentOpen: open };
      })
    );

    const board = teacher.board || [];
    const classes = teacher.classes || [];
    const subjects = teacher.subjects || [];
    let combinations = board.flatMap((brd) =>
      classes.flatMap((cls) =>
        subjects.map((sub) => ({ board: brd, classLevel: cls, subject: sub }))
      )
    );
    if (combinations.length === 0 && batchesWithCount.length > 0) {
      combinations = batchesWithCount.map((b) => ({
        board: b.board || '',
        classLevel: b.classLevel || '',
        subject: b.subject || '',
      }));
      const seen = new Set<string>();
      combinations = combinations.filter((c) => {
        const key = `${c.board}|${c.classLevel}|${c.subject}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return NextResponse.json({
      batches: batchesWithCount,
      combinations,
    });
  } catch (error) {
    console.error('Teacher batches error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { name, board, classLevel, subject, minStudents = 1, maxStudents = 3, feePerMonth = 2000, slots = [], startDate, enrollmentClosureType = 'teacher_only' } = body;

    if (!name || !board || !classLevel || !subject) {
      return NextResponse.json({ error: 'name, board, classLevel, subject required' }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({ error: 'Batch start date is required' }, { status: 400 });
    }

    const startDateObj = new Date(startDate);
    const validation = validateBatchStartDate(startDateObj);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const validClosure = ['teacher_only', 'one_week_after_start', 'max_students_reached'].includes(enrollmentClosureType)
      ? enrollmentClosureType
      : 'teacher_only';
    const newBatch = {
      name,
      board,
      classLevel,
      subject,
      minStudents: Math.min(3, Math.max(1, minStudents)),
      maxStudents: Math.min(3, Math.max(1, maxStudents)),
      feePerMonth: feePerMonth || 2000,
      slots: Array.isArray(slots) ? slots : [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }],
      isActive: true,
      startDate: startDateObj,
      enrollmentOpen: true,
      enrollmentClosureType: validClosure,
    };

    teacher.batches = teacher.batches || [];
    teacher.batches.push(newBatch);
    await teacher.save();

    return NextResponse.json({ success: true, batch: newBatch });
  } catch (error) {
    console.error('Teacher batch create error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
