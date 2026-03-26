import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { ClassSession } from '@/lib/models/ClassSession';
import { Enrollment } from '@/lib/models/Enrollment';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { PaymentDispute } from '@/lib/models/PaymentDispute';
import { Teacher } from '@/lib/models/Teacher';
import { DashboardMetrics } from '@/lib/models/DashboardMetrics';
import { getAuthFromRequest } from '@/lib/auth';
import { ParentWishlist } from '@/lib/models/ParentWishlist';

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function buildDeltaSuggestion(lastScores: number[]) {
  if (lastScores.length < 2) return 'Keep practicing daily — your next exam can get even better.';
  const delta = lastScores[0] - lastScores[1];
  if (delta >= 8) return 'Great improvement! Revise the last exam questions before the next test.';
  if (delta <= -8) return 'A drop noticed. Do short daily revisions and ask your teacher for a targeted plan.';
  return 'Steady progress. Focus on weak topics and take the next exam confidently!';
}

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId }).lean();
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);

    // Parent-friendly: show only "class in 15 minutes" (no upcoming classes list)
    const classSoonSessions = await ClassSession.find({
      status: 'scheduled',
      parentIds: parent._id,
      scheduledAt: { $gte: now, $lte: in15Min },
    })
      .populate('teacherId', 'name')
      .populate('studentIds', 'name')
      .populate('studentId', 'name')
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean();

    const smartNotifications = classSoonSessions.map((s: any) => {
      const scheduledAt = new Date(s.scheduledAt || now);
      const timeStr = formatTime(scheduledAt);
      const subject = s.subject || 'Class';
      const teacherName = s.teacherId?.name || 'your teacher';
      const studentNames =
        (s.studentIds || [])
          .map((st: any) => st?.name)
          .filter(Boolean)
          .join(', ') || s.studentId?.name || 'Your child';

      return {
        type: 'class_soon',
        title: 'Class in 15 min!',
        message: `${studentNames}: ${subject} with ${teacherName} at ${timeStr}`,
        href: '/parent/classes',
        priority: 'high' as const,
      };
    });

    // Pending actions
    const paymentFailedItems = await PendingEnrollment.find({
      parentId: parent._id,
      paymentStatus: 'failed',
    })
      .populate('teacherId', 'name')
      .lean();

    const pendingMappingItems = await PendingEnrollment.find({
      parentId: parent._id,
      paymentStatus: 'completed',
      convertedToEnrollmentId: null,
    }).lean();

    const upcomingRenewals = await Enrollment.find({
      studentId: { $in: parent.children || [] },
      status: 'active',
      endDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
    })
      .populate('studentId', 'name')
      .populate('teacherId', 'name')
      .sort({ endDate: 1 })
      .limit(10)
      .lean();

    const disputes = await PaymentDispute.find({ userId: decoded.userId })
      .select('subject status')
      .lean();

    const pendingActions: { type: string; title: string; message: string; href: string; count?: number }[] = [];
    if (paymentFailedItems.length > 0) {
      pendingActions.push({
        type: 'payment_failed',
        title: 'Payment failed',
        message: 'Complete payment to secure your seat',
        href: `/parent/payment?pendingId=${(paymentFailedItems[0] as { _id: unknown })._id}`,
        count: paymentFailedItems.length,
      });
    }
    if (pendingMappingItems.length > 0) {
      pendingActions.push({
        type: 'pending_mapping',
        title: 'Complete enrollment',
        message: 'Link student to complete your booking',
        href: `/parent/payment?pendingId=${(pendingMappingItems[0] as { _id: unknown })._id}`,
        count: pendingMappingItems.length,
      });
    }
    if (upcomingRenewals.length > 0) {
      pendingActions.push({
        type: 'renewal',
        title: 'Renewals due',
        message: `${upcomingRenewals.length} enrollment(s) ending soon`,
        href: '/parent/payments',
        count: upcomingRenewals.length,
      });
    }
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

    // Kids performance + AI suggestions + teacher recommendations
    const kids = await Student.find({
      _id: { $in: parent.children || [] },
    })
      .select('studentId userId name board classLevel photoUrl')
      .lean();

    const kidIds = kids.map((k: any) => k._id);

    const kidsDetails = await Promise.all(
      kids.map(async (k: any) => {
        const exams = await StudentExam.find({ studentId: k._id })
          .sort({ attemptedAt: -1 })
          .limit(6)
          .lean();

        const examsTaken = await StudentExam.countDocuments({ studentId: k._id });
        const avgAgg = await StudentExam.aggregate([
          { $match: { studentId: k._id } },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]);
        const avgScore = avgAgg[0]?.avg ?? 0;

        const classesDone = await ClassSession.countDocuments({
          status: 'completed',
          $or: [{ studentId: k._id }, { studentIds: k._id }],
        });

        const [courseMaterialGenerated, doubtsAnswered] = await Promise.all([
          AIGeneratedContent.countDocuments({
            type: 'resource',
            requesterRole: 'student',
            requestedBy: k.userId,
          }),
          AIGeneratedContent.countDocuments({
            type: 'doubt_answer',
            requesterRole: 'student',
            requestedBy: k.userId,
          }),
        ]);

        const lastScores = exams.slice(0, 2).map((e: any) => Number(e.score));
        const suggestion = buildDeltaSuggestion(lastScores);

        const chartData =
          exams.length > 0
            ? exams
                .slice()
                .reverse()
                .map((e: any) => ({
                  label: new Date(e.attemptedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                  value: Number(e.score),
                  color: '#6366f1',
                }))
            : [];

        return {
          studentMongoId: String(k._id),
          studentId: k.studentId,
          name: k.name,
          board: k.board,
          classLevel: k.classLevel,
          stats: {
            classesDone,
            examsTaken,
            avgScore: Math.round(avgScore * 10) / 10,
            courseMaterialGenerated,
            doubtsAnswered,
          },
          chartData,
          aiInsights: {
            performanceSummary: exams.length
              ? `Avg score: ${Math.round(avgScore * 10) / 10}% across ${examsTaken} exam(s).`
              : 'No exam data yet — take your first exam to unlock insights.',
            suggestions: [
              suggestion,
              courseMaterialGenerated === 0 ? 'Generate course resources (or ask a doubt) to learn faster.' : 'Nice! Use generated resources before your next exam.',
              doubtsAnswered === 0 ? 'Ask a doubt in your weak topic — AI will answer instantly.' : 'Great use of doubts. Keep clearing doubts regularly!',
            ],
          },
        };
      })
    );

    const overall = {
      totalClassesDone: kidsDetails.reduce((s: number, k: any) => s + k.stats.classesDone, 0),
      totalExamsTaken: kidsDetails.reduce((s: number, k: any) => s + k.stats.examsTaken, 0),
      totalCourseMaterialGenerated: kidsDetails.reduce((s: number, k: any) => s + k.stats.courseMaterialGenerated, 0),
      totalDoubtsAnswered: kidsDetails.reduce((s: number, k: any) => s + k.stats.doubtsAnswered, 0),
      avgScore: kidsDetails.length
        ? Math.round((kidsDetails.reduce((s: number, k: any) => s + k.stats.avgScore, 0) / kidsDetails.length) * 10) / 10
        : 0,
    };

    const totalEnrollments = await Enrollment.countDocuments({
      studentId: { $in: kidIds },
      status: 'active',
    });

    // Best teacher recommendations based on kids board + class
    const uniqueKidMatches = Array.from(
      new Set(kids.map((k: any) => `${k.board}::${k.classLevel}`))
    ).map((s: string) => {
      const [board, classLevel] = s.split('::');
      return { board, classLevel };
    });

    const teachers = await Teacher.find({ status: 'qualified' })
      .select('name photoUrl batches')
      .lean();

    const bestTeachersWithScore = await Promise.all(
      teachers.map(async (t: any) => {
        const batches: any[] = t.batches || [];
        let matchCount = 0;
        const matchedSubjectsSet = new Set<string>();

        for (const b of batches) {
          if (!b?.board || !b?.classLevel) continue;
          const key = `${b.board}::${b.classLevel}`;
          if (uniqueKidMatches.some((x) => `${x.board}::${x.classLevel}` === key)) {
            matchCount += 1;
            if (b.subject) matchedSubjectsSet.add(String(b.subject));
          }
        }

        if (matchCount === 0) return null;

        const taughtCount = await ClassSession.countDocuments({
          teacherId: t._id,
          status: 'completed',
          $or: [{ studentId: { $in: kidIds } }, { studentIds: { $in: kidIds } }],
        });

        const score = matchCount * 10 + taughtCount;
        return {
          teacherId: String(t._id),
          name: t.name,
          photoUrl: t.photoUrl,
          matchedSubjects: Array.from(matchedSubjectsSet).slice(0, 6),
          matchReason: `Matches your kids (board + class). ${taughtCount > 0 ? `${taughtCount} past class(es) completed for your family.` : 'Great for new learners too!'}`,
          score,
        };
      })
    );

    const bestTeachers = (bestTeachersWithScore.filter(Boolean) as any[])
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((t: any) => ({
        teacherId: t.teacherId,
        name: t.name,
        photoUrl: t.photoUrl,
        matchReason: t.matchReason,
        matchedSubjects: t.matchedSubjects,
      }));

    // Checklist (onboarding)
    const { User } = await import('@/lib/models/User');
    const user = await User.findById(decoded.userId).lean();
    const wishlistCount = await ParentWishlist.countDocuments({ parentId: parent._id });
    const checklist = [
      { id: 'phone', label: 'Verify phone number', done: !!(parent.phone?.trim()), href: '/parent/profile', cta: 'Verify' },
      { id: 'email', label: 'Verify email address', done: !!(user?.emailVerifiedAt), href: '/parent/profile', cta: 'Verify' },
      { id: 'student', label: 'Add at least one student', done: (parent.children?.length ?? 0) > 0, href: '/parent/students', cta: 'Add student' },
      { id: 'search', label: 'Search for a teacher', done: wishlistCount > 0, href: '/parent/marketplace', cta: 'Search' },
    ];

    // AI metrics (from cron)
    const metricsDoc = await DashboardMetrics.findOne({ userId: decoded.userId }).lean();

    // Quick links
    const quickLinks = [
      { href: '/parent/students', icon: '👦', label: 'Students' },
      { href: '/parent/marketplace', icon: '👩‍🏫', label: 'Teachers' },
      { href: '/parent/classes', icon: '📅', label: 'Classes' },
      { href: '/parent/performances', icon: '📊', label: 'Performances' },
      { href: '/parent/payments', icon: '💰', label: 'Payments' },
      { href: '/parent/profile', icon: '👤', label: 'Profile' },
    ];

    return NextResponse.json({
      profile: { name: parent.name, email: (user as { email?: string })?.email },
      checklist,
      pendingActions,
      smartNotifications,
      bestTeachers,
      kids: kidsDetails,
      stats: {
        activeEnrollments: totalEnrollments,
        totalClassesDone: overall.totalClassesDone,
        totalExamsTaken: overall.totalExamsTaken,
        avgScore: overall.avgScore,
        totalCourseMaterialGenerated: overall.totalCourseMaterialGenerated,
        totalDoubtsAnswered: overall.totalDoubtsAnswered,
      },
      metrics: metricsDoc?.metrics,
      quickLinks,
    });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
