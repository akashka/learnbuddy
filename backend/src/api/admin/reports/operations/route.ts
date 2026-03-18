import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Enrollment, PendingEnrollment } from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Operations: class completion, capacity, pipeline */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') || '30', 10)));

    await connectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Class session metrics
    const [scheduled, completed, cancelled, inProgress] = await Promise.all([
      ClassSession.countDocuments({ scheduledAt: { $gte: startDate } }),
      ClassSession.countDocuments({ status: 'completed', scheduledAt: { $gte: startDate } }),
      ClassSession.countDocuments({ status: 'cancelled', scheduledAt: { $gte: startDate } }),
      ClassSession.countDocuments({ status: 'in_progress' }),
    ]);

    const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
    const cancellationRate = scheduled > 0 ? Math.round((cancelled / scheduled) * 100) : 0;

    // Sessions by day
    const groupStage = {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
        scheduled: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    };
    const sessionsByDay = await ClassSession.aggregate([
      { $match: { scheduledAt: { $gte: startDate } } },
      groupStage,
      { $sort: { _id: 1 } },
    ]);

    // Pipeline: pending enrollments
    const pendingEnrollments = await PendingEnrollment.countDocuments();

    // Active enrollments
    const activeEnrollments = await Enrollment.countDocuments({ status: 'active' });

    // Sessions by subject (top)
    const bySubject = await ClassSession.aggregate([
      { $match: { scheduledAt: { $gte: startDate }, status: 'completed' } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      periodDays: days,
      metrics: {
        scheduledClasses: scheduled,
        completedClasses: completed,
        cancelledClasses: cancelled,
        inProgressNow: inProgress,
        completionRate,
        cancellationRate,
        pendingEnrollments,
        activeEnrollments,
      },
      sessionsByDay: sessionsByDay.map((d) => ({
        date: d._id,
        scheduled: d.scheduled,
        completed: d.completed,
      })),
      bySubject: bySubject.map((s) => ({ name: s._id || 'Unknown', count: s.count })),
    });
  } catch (error) {
    console.error('Operations report error:', error);
    return NextResponse.json({ error: 'Failed to fetch operations report' }, { status: 500 });
  }
}
