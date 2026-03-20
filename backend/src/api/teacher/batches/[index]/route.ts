import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

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

/** PATCH - Update batch (only if no students enrolled) or set isActive: false */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ index: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { index } = await context.params;
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
      return NextResponse.json({ error: 'Invalid batch index' }, { status: 400 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const batches = teacher.batches || [];
    const batch = batches[idx];
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const enrolledCount = await Enrollment.countDocuments({
      teacherId: teacher._id,
      batchId: batch.name || '',
      status: { $in: ['active', 'completed'] },
    });

    const body = (await request.json()) as {
      isActive?: boolean;
      enrollmentOpen?: boolean;
      enrollmentClosureType?: 'teacher_only' | 'one_week_after_start' | 'max_students_reached';
      name?: string;
      board?: string;
      classLevel?: string;
      subject?: string;
      minStudents?: number;
      maxStudents?: number;
      feePerMonth?: number;
      slots?: { day: string; startTime: string; endTime: string }[];
      startDate?: string;
    };

    if (body.enrollmentOpen === false || body.enrollmentOpen === true) {
      batches[idx] = { ...batch, enrollmentOpen: body.enrollmentOpen };
      teacher.batches = batches;
      await teacher.save();
      return NextResponse.json({ success: true, batch: batches[idx] });
    }

    if (body.isActive === false) {
      if (enrolledCount > 0) {
        return NextResponse.json(
          { error: 'Cannot deactivate batch with enrolled students' },
          { status: 400 }
        );
      }
      batches[idx] = { ...batch, isActive: false };
      teacher.batches = batches;
      await teacher.save();
      return NextResponse.json({ success: true, batch: batches[idx] });
    }

    if (enrolledCount > 0) {
      return NextResponse.json(
        { error: 'Cannot update batch with enrolled students' },
        { status: 400 }
      );
    }

    const updates: Partial<typeof batch> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.board !== undefined) updates.board = body.board;
    if (body.classLevel !== undefined) updates.classLevel = body.classLevel;
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.minStudents !== undefined) updates.minStudents = Math.min(3, Math.max(1, body.minStudents));
    if (body.maxStudents !== undefined) updates.maxStudents = Math.min(3, Math.max(1, body.maxStudents));
    if (body.feePerMonth !== undefined) updates.feePerMonth = body.feePerMonth;
    if (body.slots !== undefined) updates.slots = body.slots;
    if (body.enrollmentClosureType !== undefined) {
      if (['teacher_only', 'one_week_after_start', 'max_students_reached'].includes(body.enrollmentClosureType)) {
        updates.enrollmentClosureType = body.enrollmentClosureType;
      }
    }
    if (body.startDate !== undefined) {
      const validation = validateBatchStartDate(new Date(body.startDate));
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      updates.startDate = new Date(body.startDate);
    }

    batches[idx] = { ...batch, ...updates };
    teacher.batches = batches;
    await teacher.save();

    return NextResponse.json({ success: true, batch: batches[idx] });
  } catch (error) {
    console.error('Teacher batch update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
