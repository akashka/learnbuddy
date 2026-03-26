import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { getAuthFromRequest } from '@/lib/auth';

/** Teacher downloads their own payment history as JSON */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const payments = await TeacherPayment.find({ teacherId: teacher._id })
      .sort({ periodStart: -1 })
      .limit(500)
      .lean();

    const data = {
      exportedAt: new Date().toISOString(),
      teacherName: teacher.name,
      payments: payments.map((p) => ({
        _id: (p as { _id?: unknown })._id,
        periodStart: (p as { periodStart?: Date }).periodStart,
        periodEnd: (p as { periodEnd?: Date }).periodEnd,
        grossAmount: (p as { grossAmount?: number }).grossAmount,
        commissionAmount: (p as { commissionAmount?: number }).commissionAmount,
        commissionPercent: (p as { commissionPercent?: number }).commissionPercent,
        tdsAmount: (p as { tdsAmount?: number }).tdsAmount,
        tdsPercent: (p as { tdsPercent?: number }).tdsPercent,
        amount: (p as { amount?: number }).amount,
        status: (p as { status?: string }).status,
        paidAt: (p as { paidAt?: Date }).paidAt,
        referenceId: (p as { referenceId?: string }).referenceId,
        breakdown: (p as { breakdown?: unknown[] }).breakdown,
        createdAt: (p as { createdAt?: Date }).createdAt,
      })),
    };

    return NextResponse.body(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="guruchakra-payments-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('Teacher payments export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
