import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';

/** Mark payment as failed. Called when payment gateway returns failure. */
export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { pendingId } = await request.json();

    if (!pendingId) {
      return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
    }

    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pending = await PendingEnrollment.findOne({
      _id: pendingId,
      parentId: parent._id,
    });
    if (!pending) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await PendingEnrollment.findByIdAndUpdate(pendingId, {
      paymentStatus: 'failed',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment fail error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
