import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const pendings = await PendingEnrollment.find({})
      .populate('parentId', 'name phone')
      .populate({ path: 'teacherId', select: 'name batches' })
      .sort({ createdAt: -1 })
      .lean();

    const completed = await Enrollment.find({})
      .populate('studentId', 'name studentId')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ pendings, completed });
  } catch (error) {
    console.error('Enrollments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
