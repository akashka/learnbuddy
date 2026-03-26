import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (teacherId) query.teacherId = teacherId;
    if (status) query.status = status;
    if (year && month) {
      const y = parseInt(year);
      const m = parseInt(month);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      query.periodStart = { $gte: start };
      query.periodEnd = { $lte: end };
    }

    const [payments, total] = await Promise.all([
      TeacherPayment.find(query)
        .populate('teacherId', 'name')
        .sort({ periodStart: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TeacherPayment.countDocuments(query),
    ]);

    return NextResponse.json({
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('List teacher payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const {
      teacherId,
      amount,
      description,
      periodStart,
      periodEnd,
      status,
      grossAmount,
      commissionAmount,
      commissionPercent,
      tdsAmount,
      tdsPercent,
      breakdown,
      referenceId,
    } = body;

    if (!teacherId || amount == null) {
      return NextResponse.json({ error: 'Teacher and amount required' }, { status: 400 });
    }

    const payment = await TeacherPayment.create({
      teacherId,
      amount: Number(amount),
      description: description || undefined,
      periodStart: periodStart ? new Date(periodStart) : new Date(),
      periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
      status: status || 'paid',
      paidAt: status === 'paid' ? new Date() : undefined,
      referenceId: referenceId || undefined,
      grossAmount: grossAmount != null ? Number(grossAmount) : undefined,
      commissionAmount: commissionAmount != null ? Number(commissionAmount) : undefined,
      commissionPercent: commissionPercent != null ? Number(commissionPercent) : undefined,
      tdsAmount: tdsAmount != null ? Number(tdsAmount) : undefined,
      tdsPercent: tdsPercent != null ? Number(tdsPercent) : undefined,
      breakdown: Array.isArray(breakdown) ? breakdown : undefined,
    });

    if (payment.status === 'paid') {
      const now = new Date();
      const periodStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
      
      const transaction = await mongoose.models.TeacherEarningTransaction.create({
        teacherId,
        type: 'payment',
        amount: Number(amount),
        description: `Payout reference: ${payment._id}`,
        referenceId: payment._id,
        referenceModel: 'TeacherPayment',
        periodStr
      });

      // Update the payment record to hold a reference to this transaction if needed
      await TeacherPayment.findByIdAndUpdate(payment._id, {
        $push: { earningTransactionIds: transaction._id }
      });
    }

    const populated = await TeacherPayment.findById(payment._id).populate('teacherId', 'name').lean();
    return NextResponse.json(populated);
  } catch (error) {
    console.error('Add teacher payment error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
