import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { ClassSession } from '@/lib/models/ClassSession';
import { ClassroomWarning } from '@/lib/models/ClassroomWarning';
import { StudentExam } from '@/lib/models/StudentExam';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
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

    const studentQuery = {
      $or: [{ studentId: student._id }, { studentIds: student._id }],
    };

    // Classes stats
    const totalClasses = await ClassSession.countDocuments(studentQuery);
    const completedClasses = await ClassSession.countDocuments({ ...studentQuery, status: 'completed' });
    const missedClasses = await ClassSession.countDocuments({ ...studentQuery, status: 'cancelled' });
    const scheduledClasses = await ClassSession.countDocuments({ ...studentQuery, status: 'scheduled' });

    // Alerts
    const sessionsForStudent = await ClassSession.find({ ...studentQuery, status: 'completed' })
      .select('_id')
      .limit(500)
      .lean();
    const sessionIds = sessionsForStudent.map((s) => s._id);
    const alertsCount = await ClassroomWarning.countDocuments({
      sessionId: { $in: sessionIds },
      targetRole: 'student',
    });

    // Exams
    const exams = await StudentExam.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const examsTaken = exams.length;
    const avgScore =
      examsTaken > 0
        ? Math.round(
            (exams.reduce((acc, e) => acc + (e.score ?? 0), 0) / examsTaken) * 10
          ) / 10
        : 0;
    const highestScore = examsTaken > 0 ? Math.max(...exams.map((e) => e.score ?? 0)) : 0;

    // Resources / study materials generated  
    const resourcesGenerated = await AIGeneratedContent.countDocuments({
      requestedBy: decoded.userId,
      requesterRole: 'student',
    }).catch(() => 0);

    // Doubts asked via study / AI ask feature
    const doubtsAsked = await AIGeneratedContent.countDocuments({
      requestedBy: decoded.userId,
      requesterRole: 'student',
      type: 'doubt_answer',
    }).catch(() => 0);

    // Score chart: last 10 exams  
    const chartData = exams
      .slice(0, 10)
      .reverse()
      .map((e, i) => ({
        label: `Exam ${i + 1}`,
        value: e.score ?? 0,
        color: (e.score ?? 0) >= 80 ? '#22c55e' : (e.score ?? 0) >= 60 ? '#f59e0b' : '#ef4444',
      }));

    // Subject-wise breakdown
    const subjectMap: Record<string, { total: number; count: number; scores: number[] }> = {};
    for (const e of exams) {
      const subject = (e as { subject?: string }).subject || 'General';
      if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0, scores: [] };
      subjectMap[subject].total += e.score ?? 0;
      subjectMap[subject].count++;
      subjectMap[subject].scores.push(e.score ?? 0);
    }
    const subjectBreakdown = Object.entries(subjectMap).map(([subject, d]) => ({
      subject,
      avgScore: Math.round((d.total / d.count) * 10) / 10,
      examCount: d.count,
      trend: d.scores.length >= 2 && d.scores[d.scores.length - 1] > d.scores[0] ? 'up' : 'stable',
    }));

    // AI metrics (pre-computed by cron)
    const metricsDoc = await DashboardMetrics.findOne({ userId: decoded.userId }).lean();
    const aiMetrics = metricsDoc?.metrics ?? null;

    return NextResponse.json({
      stats: {
        totalClasses,
        completedClasses,
        missedClasses,
        scheduledClasses,
        alertsCount,
        examsTaken,
        avgScore,
        highestScore,
        doubtsAsked,
        resourcesGenerated,
      },
      chartData,
      subjectBreakdown,
      recentExams: exams.slice(0, 5).map((e) => ({
        _id: e._id,
        subject: (e as { subject?: string }).subject,
        score: e.score,
        total: (e as { totalMarks?: number }).totalMarks,
        createdAt: e.createdAt,
      })),
      aiMetrics,
    });
  } catch (error) {
    console.error('Student performance error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
