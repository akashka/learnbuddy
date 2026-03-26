import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { ClassSession } from '@/lib/models/ClassSession';
import { Enrollment } from '@/lib/models/Enrollment';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { PaymentDispute } from '@/lib/models/PaymentDispute';
import { Parent } from '@/lib/models/Parent';
import { DashboardMetrics } from '@/lib/models/DashboardMetrics';
import { getAuthFromRequest } from '@/lib/auth';

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function buildDeltaSuggestion(lastScores: number[]) {
  if (lastScores.length < 2) return 'Keep the momentum going with short daily practice.';
  const delta = lastScores[0] - lastScores[1];
  if (delta >= 8) return 'Great improvement! Revise the last exam questions before the next test.';
  if (delta <= -8) return 'A drop noticed. Do short daily revisions and focus on weak topics.';
  return 'Steady progress. Focus on weak topics and take the next exam confidently!';
}

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Smart notifications: only "class in 15 minutes"
    const classSoonSessions = await ClassSession.find({
      teacherId: teacher._id,
      status: 'scheduled',
      scheduledAt: { $gte: now, $lte: in15Min },
    })
      .populate('studentIds', 'name')
      .populate('studentId', 'name')
      .lean();

    const smartNotifications: { type: string; title: string; message: string; href: string; priority: 'high' | 'medium' | 'low' }[] =
      classSoonSessions.map((s: any) => {
        const scheduledAt = new Date(s.scheduledAt || now);
        const timeStr = formatTime(scheduledAt);
        const subject = s.subject || 'Class';
        const studentNames =
          (s.studentIds || [])
            .map((st: any) => st?.name)
            .filter(Boolean)
            .join(', ') || s.studentId?.name || 'Student';

        return {
          type: 'class_soon',
          title: 'Class in 15 min!',
          message: `${subject} with ${studentNames} at ${timeStr}`,
          href: '/teacher/classes',
          priority: 'high',
        };
      });

    // Batch starting tomorrow
    const batches = (teacher.batches || []) as { subject?: string; name?: string; startDate?: Date }[];
    for (const b of batches) {
      const startDate = b?.startDate ? new Date(b.startDate) : null;
      if (startDate && startDate >= tomorrow && startDate <= tomorrowEnd) {
        smartNotifications.push({
          type: 'batch_start',
          title: 'Batch starts tomorrow!',
          message: `${b.subject || 'Batch'} (${b.name || 'Batch'})`,
          href: '/teacher/batches',
          priority: 'medium',
        });
      }
    }

    // Pending actions (teacher: primarily disputes)
    const disputes = await PaymentDispute.find({ userId: decoded.userId })
      .select('subject status')
      .lean();

    const pendingActions: { type: string; title: string; message: string; href: string; count?: number }[] = [];
    const openDisputes = disputes.filter((d: { status: string }) => d.status === 'open' || d.status === 'in_review');
    if (openDisputes.length > 0) {
      pendingActions.push({
        type: 'dispute',
        title: 'Open disputes',
        message: 'Track your dispute status',
        href: '/disputes',
        count: openDisputes.length,
      });
    }

    // Stats + students profiles for teacher dashboard
    const totalStudents = await Enrollment.countDocuments({
      teacherId: teacher._id,
      status: 'active',
    });

    const classesConductedAllTime = await ClassSession.countDocuments({
      teacherId: teacher._id,
      status: 'completed',
    });

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [earningsWeekAgg, earningsMonthAgg] = await Promise.all([
      TeacherPayment.aggregate([
        {
          $match: {
            teacherId: teacher._id,
            status: 'paid',
            periodStart: { $gte: startOfWeek, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      TeacherPayment.aggregate([
        {
          $match: {
            teacherId: teacher._id,
            status: 'paid',
            periodStart: { $gte: startOfMonth, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const earnedThisWeek = earningsWeekAgg[0]?.total ?? 0;
    const earnedThisMonth = earningsMonthAgg[0]?.total ?? 0;

    const classesConductedThisMonth = await ClassSession.countDocuments({
      teacherId: teacher._id,
      status: 'completed',
      scheduledAt: { $gte: startOfMonth, $lte: now },
    });

    const activeEnrollments = await Enrollment.find({
      teacherId: teacher._id,
      status: 'active',
    })
      .select('studentId')
      .lean();

    const studentIds = Array.from(new Set(activeEnrollments.map((e: any) => e.studentId))).filter(Boolean);
    const studentsDocs = await Student.find({ _id: { $in: studentIds } })
      .select('studentId userId name board classLevel photoUrl parentId')
      .lean();

    const parentIds = Array.from(new Set(studentsDocs.map((s: any) => s.parentId))).filter(Boolean);
    const parentsDocs = await Parent.find({ _id: { $in: parentIds } }).select('name').lean();
    const parentNameById = new Map(parentsDocs.map((p: any) => [String(p._id), p.name]));

    const students = await Promise.all(
      studentsDocs.map(async (s: any) => {
        const examCount = await StudentExam.countDocuments({ studentId: s._id });
        const avgAgg = await StudentExam.aggregate([
          { $match: { studentId: s._id } },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]);
        const avgScore = avgAgg[0]?.avg ?? 0;

        const last2Exams = await StudentExam.find({ studentId: s._id })
          .sort({ attemptedAt: -1 })
          .limit(2)
          .select('score attemptedAt')
          .lean();
        const deltaSuggestion =
          last2Exams.length >= 2 ? buildDeltaSuggestion([Number(last2Exams[0].score), Number(last2Exams[1].score)]) : 'Keep the momentum going with short daily practice.';

        const [courseMaterialGeneratedThisMonth, doubtsAnsweredThisMonth] = await Promise.all([
          AIGeneratedContent.countDocuments({
            type: 'resource',
            requesterRole: 'student',
            requestedBy: s.userId,
            createdAt: { $gte: startOfMonth, $lte: now },
          }),
          AIGeneratedContent.countDocuments({
            type: 'doubt_answer',
            requesterRole: 'student',
            requestedBy: s.userId,
            createdAt: { $gte: startOfMonth, $lte: now },
          }),
        ]);

        const chartData =
          examCount > 0
            ? (await StudentExam.find({ studentId: s._id })
                .sort({ attemptedAt: -1 })
                .limit(6)
                .select('score attemptedAt')
                .lean()
                .then((exams) =>
                  exams
                    .slice()
                    .reverse()
                    .map((e: any) => ({
                      label: new Date(e.attemptedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                      value: Number(e.score),
                      color: '#16a34a',
                    }))
                ))
            : [];

        const classesDoneAllTime = await ClassSession.countDocuments({
          teacherId: teacher._id,
          status: 'completed',
          $or: [{ studentId: s._id }, { studentIds: s._id }],
        });

        return {
          studentMongoId: String(s._id),
          studentId: s.studentId,
          name: s.name,
          parentName: parentNameById.get(String(s.parentId)) || 'Parent',
          board: s.board,
          classLevel: s.classLevel,
          stats: {
            examsTaken: examCount,
            avgScore: Math.round(avgScore * 10) / 10,
            classesDoneAllTime,
            courseMaterialGeneratedThisMonth,
            doubtsAnsweredThisMonth,
          },
          chartData,
          aiSuggestions: [deltaSuggestion],
        };
      })
    );

    const aiInsights = {
      performanceTip: (() => {
        const avg = students.length
          ? students.reduce((sum: number, st: any) => sum + Number(st.stats.avgScore || 0), 0) / students.length
          : 0;
        if (avg < 60) return 'Focus on weak topics with short daily practice and targeted doubt sessions.';
        if (avg > 80) return 'Your batch is performing strongly. Keep them challenged with extra mock/quiz practice.';
        return 'Good overall progress. Use generated resources and review mistakes before the next exam.';
      })(),
    };

    // (Optionally extend with charts later; UI focuses on the cards + charts per student)

    // Checklist
    const batchCount = batches.length;
    const checklist = [
      { id: 'profile', label: 'Complete profile', done: !!(teacher.name && teacher.phone), href: '/teacher/profile', cta: 'Complete' },
      { id: 'batches', label: 'Create at least one batch', done: batchCount > 0, href: '/teacher/batches', cta: 'Create batch' },
      { id: 'bank', label: 'Add bank details', done: !!((teacher as { bankDetails?: unknown }).bankDetails), href: '/teacher/profile', cta: 'Add' },
    ];

    const metricsDoc = await DashboardMetrics.findOne({ userId: decoded.userId }).lean();

    const quickLinks = [
      { href: '/teacher/batches', icon: '📦', label: 'Batches' },
      { href: '/teacher/students', icon: '👥', label: 'Students' },
      { href: '/teacher/classes', icon: '📅', label: 'Classes' },
      { href: '/teacher/payments', icon: '💰', label: 'Payments' },
      { href: '/teacher/profile', icon: '👤', label: 'Profile' },
    ];

    return NextResponse.json({
      profile: { name: teacher.name },
      checklist,
      pendingActions,
      smartNotifications,
      stats: {
        totalStudents,
        earnedThisWeek: Math.round(earnedThisWeek),
        earnedThisMonth: Math.round(earnedThisMonth),
        classesConductedAllTime,
        classesConductedThisMonth,
      },
      students,
      aiInsights,
      metrics: metricsDoc?.metrics,
      quickLinks,
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
