import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherPaymentRequest } from '@/lib/models/TeacherPaymentRequest';
import { getAuthFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    const body = (await request.json()) as any;
    const { status, adminNotes } = body;

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectDB();
    
    const paymentRequest = await TeacherPaymentRequest.findById(id);
    if (!paymentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is already resolved' }, { status: 400 });
    }

    paymentRequest.status = status;
    paymentRequest.adminNotes = adminNotes;
    paymentRequest.resolvedBy = decoded.userId as any;
    paymentRequest.resolvedAt = new Date();

    await paymentRequest.save();

    return NextResponse.json({ message: 'Request updated', request: paymentRequest });
  } catch (error) {
    console.error('Admin resolve payment request PUT error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
