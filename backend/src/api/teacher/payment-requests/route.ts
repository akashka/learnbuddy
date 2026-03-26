import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherPaymentRequest } from '@/lib/models/TeacherPaymentRequest';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const requests = await TeacherPaymentRequest.find({ teacherId: teacher._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Teacher payment requests GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as any;
    const { amount, reason } = body;

    if (!amount || amount <= 0 || !reason) {
      return NextResponse.json({ error: 'Amount and reason are required' }, { status: 400 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check if there is already a pending request
    const pendingRequest = await TeacherPaymentRequest.findOne({ teacherId: teacher._id, status: 'pending' });
    if (pendingRequest) {
      return NextResponse.json({ error: 'You already have a pending payment request' }, { status: 400 });
    }

    const paymentRequest = new TeacherPaymentRequest({
      teacherId: teacher._id,
      amount,
      reason,
      status: 'pending',
    });

    await paymentRequest.save();

    return NextResponse.json({ message: 'Payment request submitted successfully', request: paymentRequest });
  } catch (error) {
    console.error('Teacher payment request POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
