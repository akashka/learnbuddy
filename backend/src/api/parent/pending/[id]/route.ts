import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Get single pending enrollment for parent (for payment page) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pending = await PendingEnrollment.findOne({
      _id: id,
      parentId: parent._id,
    })
      .populate('teacherId', 'name batches')
      .lean();

    if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const teacher = pending.teacherId as { name?: string; batches?: { subject?: string }[] } | null;

    return NextResponse.json({
      _id: pending._id,
      subject: pending.subject,
      totalAmount: pending.totalAmount,
      paymentStatus: pending.paymentStatus,
      teacherName: teacher?.name,
    });
  } catch (error) {
    console.error('Pending get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
