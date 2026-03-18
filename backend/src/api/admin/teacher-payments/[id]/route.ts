import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const payment = await TeacherPayment.findById(id)
      .populate('teacherId', 'name bankDetails')
      .lean();

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Payment detail error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
