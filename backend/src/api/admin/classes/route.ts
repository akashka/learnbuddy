import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200);

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (from || to) {
      query.scheduledAt = {};
      if (from) (query.scheduledAt as Record<string, Date>).$gte = new Date(from);
      if (to) (query.scheduledAt as Record<string, Date>).$lte = new Date(to);
    }

    const sessions = await ClassSession.find(query)
      .populate('enrollmentId', 'subject batchId classLevel')
      .populate('teacherId', 'name')
      .populate('studentId', 'name studentId')
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .lean();

    const enrollments = await Enrollment.find({ status: 'active' })
      .populate('teacherId', 'name')
      .populate('studentId', 'name studentId')
      .select('_id subject batchId classLevel slots startDate endDate teacherId studentId')
      .lean();

    return NextResponse.json({
      sessions,
      enrollments: enrollments.map((e) => ({
        _id: e._id,
        subject: e.subject,
        batchId: e.batchId,
        classLevel: e.classLevel,
        slots: e.slots,
        startDate: e.startDate,
        endDate: e.endDate,
        teacher: (e.teacherId as { name?: string })?.name,
        teacherId: (e.teacherId as { _id?: unknown })?._id,
        student: (e.studentId as { name?: string })?.name,
        studentId: (e.studentId as { studentId?: string })?.studentId,
        studentDocId: (e.studentId as { _id?: unknown })?._id,
      })),
    });
  } catch (error) {
    console.error('Admin classes error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
