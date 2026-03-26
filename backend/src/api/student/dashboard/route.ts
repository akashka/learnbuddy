import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { ClassSession } from '@/lib/models/ClassSession';
import { StudentExam } from '@/lib/models/StudentExam';
import { Enrollment } from '@/lib/models/Enrollment';
import { DashboardMetrics } from '@/lib/models/DashboardMetrics';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId }).lean();
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Upcoming classes
    const studentQuery = {
      $or: [{ studentId: student._id }, { studentIds: student._id }],
    };
    const upcomingSessions = await ClassSession.find({
      ...studentQuery,
      status: 'scheduled',
      scheduledAt: { $gte: now, $lte: in2Hours },
    })
      .populate('teacherId', 'name')
      .sort({ scheduledAt: 1 })
      .limit(10)
      .lean();

    const smartNotifications: { type: string; title: string; message: string; href: string; priority: 'high' | 'medium' | 'low' }[] = [];
    for (const s of upcomingSessions) {
      const scheduledAt = new Date((s as { scheduledAt?: Date }).scheduledAt || 0);
      const timeStr = scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const subject = (s as { subject?: string }).subject || 'Class';
      if (scheduledAt <= in15Min) {
        smartNotifications.push({
          type: 'class_soon',
          title: 'Class in 15 min! 🚀',
          message: `${subject} at ${timeStr} — get ready!`,
          href: '/student/classes',
          priority: 'high',
        });
      } else {
        smartNotifications.push({
          type: 'class_upcoming',
          title: 'Upcoming class',
          message: `${subject} at ${timeStr}`,
          href: '/student/classes',
          priority: 'medium',
        });
      }
    }

    // Pending actions (e.g. exams due, assignments)
    const pendingActions: { type: string; title: string; message: string; href: string }[] = [];

    // Stats
    const courseCount = await Enrollment.countDocuments({
      studentId: student._id,
      status: 'active',
    });
    const examsTaken = await StudentExam.countDocuments({ studentId: student._id });
    const avgScore =
      examsTaken > 0
        ? (await StudentExam.aggregate([
            { $match: { studentId: student._id } },
            { $group: { _id: null, avg: { $avg: '$score' } } },
          ]))?.[0]?.avg ?? 0
        : 0;
    const classesAttended = await ClassSession.countDocuments({
      ...studentQuery,
      status: 'completed',
    });

    const checklist = [
      { id: 'courses', label: 'View your courses', done: courseCount > 0, href: '/student/courses', cta: 'View' },
      { id: 'class', label: 'Join your next class', done: upcomingSessions.length > 0, href: '/student/classes', cta: 'View' },
      { id: 'exam', label: 'Take an exam', done: examsTaken > 0, href: '/student/exams', cta: 'Take exam' },
    ];

    const metricsDoc = await DashboardMetrics.findOne({ userId: decoded.userId }).lean();

    const quickLinks = [
      { href: '/student/courses', icon: '📚', label: 'My Courses' },
      { href: '/student/classes', icon: '📅', label: 'Classes' },
      { href: '/student/exams', icon: '📝', label: 'Exams' },
      { href: '/student/study', icon: '📖', label: 'Study' },
      { href: '/student/profile', icon: '👤', label: 'Profile' },
      { href: '/student/performance', icon: '🏆', label: 'Performance' },
    ];

    return NextResponse.json({
      profile: { name: student.name, studentId: student.studentId, classLevel: student.classLevel },
      checklist,
      pendingActions,
      smartNotifications: smartNotifications.slice(0, 5),
      stats: {
        courses: courseCount,
        examsTaken,
        avgScore: Math.round(avgScore * 10) / 10,
        classesAttended,
      },
      metrics: metricsDoc?.metrics,
      quickLinks,
      upcomingClasses: upcomingSessions.slice(0, 5).map((s) => ({
        _id: (s as { _id?: unknown })._id,
        subject: (s as { subject?: string }).subject,
        scheduledAt: (s as { scheduledAt?: Date }).scheduledAt,
        teacher: (s as { teacherId?: { name?: string } }).teacherId,
      })),
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
