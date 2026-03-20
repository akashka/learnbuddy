import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/** Admin: List teachers with pending payments (had completed classes but no payment record) for current and previous month */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const periods = [
      { year: currentYear, month: currentMonth },
      { year: prevYear, month: prevMonth },
    ];

    const reminders: { teacherId: string; teacherName: string; year: number; month: number }[] = [];

    for (const { year, month } of periods) {
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59);

      const sessions = await ClassSession.find({
        status: 'completed',
        scheduledAt: { $gte: periodStart, $lte: periodEnd },
      })
        .distinct('teacherId')
        .lean();

      const teacherIds = sessions.filter(Boolean) as mongoose.Types.ObjectId[];
      if (teacherIds.length === 0) continue;

      const existingPayments = await TeacherPayment.find({
        teacherId: { $in: teacherIds },
        periodStart: { $gte: periodStart },
        periodEnd: { $lte: periodEnd },
      })
        .distinct('teacherId')
        .lean();

      const paidTeacherIds = new Set(existingPayments.map((id) => id?.toString()).filter(Boolean));
      const pendingTeacherIds = teacherIds.filter((id) => !paidTeacherIds.has(id.toString()));

      if (pendingTeacherIds.length === 0) continue;

      const teachers = await Teacher.find({ _id: { $in: pendingTeacherIds } })
        .select('_id name')
        .lean();

      for (const t of teachers) {
        reminders.push({
          teacherId: (t as { _id?: mongoose.Types.ObjectId })._id?.toString() ?? '',
          teacherName: (t as { name?: string }).name ?? 'Unknown',
          year,
          month,
        });
      }
    }

    reminders.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return (a.teacherName || '').localeCompare(b.teacherName || '');
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Payment reminders error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}
