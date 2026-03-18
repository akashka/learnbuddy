import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models/Enrollment';
import { getAuthFromRequest } from '@/lib/auth';

// Payment duration discounts: 3 months = 0%, 6 months = 5%, 12 months = 10%
const DISCOUNTS = { '3months': 0, '6months': 5, '12months': 10 };

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { studentId, teacherId, batchId, duration = '3months' } = body;

    if (!studentId || !teacherId || !batchId) {
      return NextResponse.json({ error: 'Student, teacher and batch required' }, { status: 400 });
    }

    // In production: fetch batch details, calculate amount, create Stripe/Razorpay order
    const months = duration === '3months' ? 3 : duration === '6months' ? 6 : 12;
    const feePerMonth = 2000; // Fetch from batch in production
    const discount = DISCOUNTS[duration as keyof typeof DISCOUNTS] ?? 0;
    const subtotal = feePerMonth * months;
    const totalAmount = Math.round(subtotal * (1 - discount / 100));

    const enrollment = await Enrollment.create({
      studentId,
      teacherId,
      batchId,
      subject: body.subject,
      board: body.board,
      classLevel: body.classLevel,
      slots: body.slots || [],
      feePerMonth,
      duration,
      discount,
      totalAmount,
      paymentStatus: 'pending',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
    });

    // Placeholder: Return payment URL. In production integrate Stripe/Razorpay
    return NextResponse.json({
      enrollmentId: enrollment._id,
      amount: totalAmount,
      paymentUrl: `/payment/checkout?enrollmentId=${enrollment._id}`,
      message: 'Redirect user to payment URL',
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
