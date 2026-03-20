import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PaymentDispute } from '@/lib/models/PaymentDispute';
import { getAuthFromRequest } from '@/lib/auth';

/** Parent or teacher: Create a payment dispute */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { subject?: string; description?: string; referenceType?: string; referenceId?: string };
    const { subject, description, referenceType, referenceId } = body;

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Subject and description required' }, { status: 400 });
    }

    await connectDB();
    const dispute = await PaymentDispute.create({
      raisedBy: decoded.role,
      userId: decoded.userId,
      referenceType: referenceType || 'other',
      referenceId: referenceId || undefined,
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
    });

    return NextResponse.json({ _id: dispute._id, message: 'Dispute raised successfully' });
  } catch (error) {
    console.error('Create dispute error:', error);
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }
}

/** Parent or teacher: List own disputes */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const disputes = await PaymentDispute.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('List disputes error:', error);
    return NextResponse.json({ error: 'Failed to list disputes' }, { status: 500 });
  }
}
