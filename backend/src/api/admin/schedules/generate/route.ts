import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Enrollment } from '@/lib/models/Enrollment';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';
import { getDatesForSlot, getSlotDurationMinutes } from '@/lib/schedule-utils';
import type { Slot } from '@/lib/schedule-utils';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { enrollmentId, weeks = 4 } = body;

    const query = enrollmentId
      ? { _id: enrollmentId, status: 'active' }
      : { status: 'active' };

    const enrollments = await Enrollment.find(query)
      .populate('teacherId', 'name')
      .populate('studentId', 'name')
      .lean();

    if (enrollments.length === 0) {
      return NextResponse.json({ error: 'No active enrollments found' }, { status: 404 });
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + (weeks * 7));

    let created = 0;
    let skipped = 0;

    for (const enr of enrollments) {
      const slots = (enr.slots || []) as Slot[];
      if (slots.length === 0) continue;

      const startDate = enr.startDate ? new Date(enr.startDate) : fromDate;
      const endDate = enr.endDate ? new Date(enr.endDate) : toDate;
      const effectiveFrom = startDate > fromDate ? startDate : fromDate;
      const effectiveTo = endDate < toDate ? endDate : toDate;

      if (effectiveFrom > effectiveTo) continue;

      for (const slot of slots) {
        const dates = getDatesForSlot(slot, effectiveFrom, effectiveTo);
        const duration = getSlotDurationMinutes(slot);

        for (const scheduledAt of dates) {
          const existing = await ClassSession.findOne({
            enrollmentId: enr._id,
            scheduledAt: { $gte: new Date(scheduledAt.getTime() - 60000), $lte: new Date(scheduledAt.getTime() + 60000) },
          });
          if (existing) {
            skipped++;
            continue;
          }

          const teacherId = (enr.teacherId as { _id?: mongoose.Types.ObjectId })?._id ?? enr.teacherId;
          const studentId = (enr.studentId as { _id?: mongoose.Types.ObjectId })?._id ?? enr.studentId;
          await ClassSession.create({
            enrollmentId: enr._id,
            teacherId,
            studentId,
            scheduledAt,
            duration,
            status: 'scheduled',
            aiMonitoringAlerts: [],
          });
          created++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      enrollmentsProcessed: enrollments.length,
    });
  } catch (error) {
    console.error('Schedule generate error:', error);
    return NextResponse.json({ error: 'Failed to generate schedules' }, { status: 500 });
  }
}
