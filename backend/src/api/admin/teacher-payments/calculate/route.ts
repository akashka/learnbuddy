import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, Enrollment } from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/** Classes per month per student (weekly = 4) */
const CLASSES_PER_MONTH = 4;

/** TDS % on professional fees (India Section 194J) */
const TDS_PERCENT = 10;

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const year = parseInt(searchParams.get('year') || '0');
    const month = parseInt(searchParams.get('month') || '0');

    if (!teacherId || !year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'teacherId, year and month (1-12) required' }, { status: 400 });
    }

    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const commissionPercent = (teacher as { commissionPercent?: number }).commissionPercent ?? 10;

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    const sessions = await ClassSession.find({
      teacherId,
      status: 'completed',
      scheduledAt: { $gte: periodStart, $lte: periodEnd },
    }).lean();

    const enrollmentIds = new Set<string>();
    for (const s of sessions) {
      const ids = (s as { enrollmentIds?: mongoose.Types.ObjectId[]; enrollmentId?: mongoose.Types.ObjectId }).enrollmentIds;
      const singleId = (s as { enrollmentId?: mongoose.Types.ObjectId }).enrollmentId;
      if (ids?.length) {
        ids.forEach((id) => enrollmentIds.add(id.toString()));
      } else if (singleId) {
        enrollmentIds.add(singleId.toString());
      }
    }

    const enrollments = await Enrollment.find({ _id: { $in: Array.from(enrollmentIds).map((id) => new mongoose.Types.ObjectId(id)) } })
      .populate('studentId', 'name studentId')
      .lean();

    const enrollmentMap = new Map<string, { studentId: string; studentName: string; batchId: string; subject: string; feePerMonth: number }>();
    for (const e of enrollments) {
      const id = (e as { _id?: mongoose.Types.ObjectId })._id?.toString();
      if (id) {
        enrollmentMap.set(id, {
          studentId: (e.studentId as { _id?: unknown })?.toString?.() ?? (e.studentId as unknown as string),
          studentName: (e.studentId as { name?: string })?.name ?? 'Student',
          batchId: (e as { batchId?: string }).batchId ?? '-',
          subject: (e as { subject?: string }).subject ?? '-',
          feePerMonth: (e as { feePerMonth?: number }).feePerMonth ?? 0,
        });
      }
    }

    const breakdownMap = new Map<string, { studentId: string; studentName: string; batchId: string; subject: string; feePerMonth: number; classesCount: number; amount: number }>();

    for (const session of sessions) {
      const ids = (session as { enrollmentIds?: mongoose.Types.ObjectId[]; enrollmentId?: mongoose.Types.ObjectId }).enrollmentIds;
      const singleId = (session as { enrollmentId?: mongoose.Types.ObjectId }).enrollmentId;
      const encIds = ids?.length ? ids : singleId ? [singleId] : [];

      for (const encId of encIds) {
        const enc = enrollmentMap.get(encId.toString());
        if (!enc || enc.feePerMonth <= 0) continue;

        const key = enc.studentId + '|' + enc.batchId + '|' + enc.subject;
        const perClassAmount = enc.feePerMonth / CLASSES_PER_MONTH;

        if (!breakdownMap.has(key)) {
          breakdownMap.set(key, {
            ...enc,
            classesCount: 0,
            amount: 0,
          });
        }
        const item = breakdownMap.get(key)!;
        item.classesCount += 1;
        item.amount += perClassAmount;
      }
    }

    const breakdown = Array.from(breakdownMap.values()).map((e) => ({
      studentId: e.studentId,
      studentName: e.studentName,
      batchId: e.batchId,
      subject: e.subject,
      classesCount: e.classesCount,
      feePerMonth: e.feePerMonth,
      amount: Math.round(e.amount * 100) / 100,
    }));

    const grossAmount = Math.round(breakdown.reduce((s, b) => s + b.amount, 0) * 100) / 100;
    const commissionAmount = Math.round(grossAmount * (commissionPercent / 100) * 100) / 100;
    const tdsAmount = Math.round(grossAmount * (TDS_PERCENT / 100) * 100) / 100;
    const netAmount = Math.round((grossAmount - commissionAmount - tdsAmount) * 100) / 100;

    return NextResponse.json({
      teacherId,
      teacherName: (teacher as { name?: string }).name,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      year,
      month,
      breakdown,
      grossAmount,
      commissionPercent,
      commissionAmount,
      tdsPercent: TDS_PERCENT,
      tdsAmount,
      netAmount,
      totalClasses: breakdown.reduce((s, b) => s + b.classesCount, 0),
    });
  } catch (error) {
    console.error('Calculate payment error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
