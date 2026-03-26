/**
 * Cron job: Compute and store dashboard metrics for parents, teachers, students.
 * AI-generated summaries can be added later; for now we compute derived stats.
 */
import mongoose from 'mongoose';
import connectDB from '../db.js';
import { DashboardMetrics } from '../models/DashboardMetrics.js';
import { Parent } from '../models/Parent.js';
import { Teacher } from '../models/Teacher.js';
import { Student } from '../models/Student.js';
import { Enrollment } from '../models/Enrollment.js';
import { StudentExam } from '../models/StudentExam.js';
import { ClassSession } from '../models/ClassSession.js';

export async function runCronDashboardMetrics(): Promise<{ updated: number; errors: string[] }> {
  await connectDB();
  const result = { updated: 0, errors: [] as string[] };

  try {
    // Parents
    const parents = await Parent.find().select('userId').lean();
    for (const p of parents) {
      if (!p.userId) continue;
      try {
        const children = (p as { children?: mongoose.Types.ObjectId[] }).children || [];
        const examAgg = await StudentExam.aggregate([
          { $match: { studentId: { $in: children } } },
          { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
        ]);
        const avg = examAgg[0]?.avg ?? 0;
        const count = examAgg[0]?.count ?? 0;
        const enrollments = await Enrollment.countDocuments({ studentId: { $in: children }, status: 'active' });

        const suggestions: string[] = [];
        if (enrollments === 0) suggestions.push('Browse teachers and enroll your child in a course.');
        else if (count === 0) suggestions.push('Encourage your child to take exams to track progress.');
        if (avg > 0 && avg < 70) suggestions.push('Consider extra practice or discussing weak topics with the teacher.');

        await DashboardMetrics.findOneAndUpdate(
          { userId: p.userId },
          {
            $set: {
              role: 'parent',
              metrics: {
                performanceSummary: count > 0 ? `Average score: ${Math.round(avg)}% across ${count} exam(s).` : 'No exams taken yet.',
                suggestions,
                estimates: [
                  { label: 'Active enrollments', value: String(enrollments), trend: 'stable' },
                  { label: 'Exams taken', value: String(count), trend: 'stable' },
                ],
                chartData: count > 0 ? [{ label: 'Avg Score', value: Math.round(avg), color: '#6366f1' }] : undefined,
              },
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        result.updated++;
      } catch (err) {
        result.errors.push(String(err));
      }
    }

    // Teachers
    const teachers = await Teacher.find({ status: 'qualified' }).select('userId').lean();
    for (const t of teachers) {
      if (!t.userId) continue;
      try {
        const students = await Enrollment.countDocuments({ teacherId: t._id, status: 'active' });
        const classesDone = await ClassSession.countDocuments({ teacherId: t._id, status: 'completed' });
        const classesUpcoming = await ClassSession.countDocuments({
          teacherId: t._id,
          status: 'scheduled',
          scheduledAt: { $gte: new Date() },
        });
        const batchCount = ((t as { batches?: unknown[] }).batches || []).length;

        const suggestions: string[] = [];
        if (students === 0) suggestions.push('Create batches and share your profile to attract students.');
        if (classesUpcoming > 0) suggestions.push(`You have ${classesUpcoming} class(es) coming up. Be ready!`);

        await DashboardMetrics.findOneAndUpdate(
          { userId: t.userId },
          {
            $set: {
              role: 'teacher',
              metrics: {
                performanceSummary: `${students} active student(s), ${classesDone} class(es) conducted.`,
                suggestions,
                estimates: [
                  { label: 'Batches', value: String(batchCount), trend: 'stable' },
                  { label: 'Students', value: String(students), trend: 'stable' },
                ],
                chartData: [
                  { label: 'Classes done', value: classesDone, color: '#10b981' },
                  { label: 'Upcoming', value: classesUpcoming, color: '#6366f1' },
                ],
              },
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        result.updated++;
      } catch (err) {
        result.errors.push(String(err));
      }
    }

    // Students
    const students = await Student.find().select('userId').lean();
    for (const s of students) {
      if (!s.userId) continue;
      try {
        const examAgg = await StudentExam.aggregate([
          { $match: { studentId: s._id } },
          { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
        ]);
        const avg = examAgg[0]?.avg ?? 0;
        const count = examAgg[0]?.count ?? 0;
        const classesAttended = await ClassSession.countDocuments({
          $or: [{ studentId: s._id }, { studentIds: s._id }],
          status: 'completed',
        });

        const suggestions: string[] = [];
        if (count === 0) suggestions.push('Take your first exam to see how you\'re doing!');
        if (avg >= 80 && count > 0) suggestions.push('Great job! Keep up the excellent work.');
        if (avg > 0 && avg < 60) suggestions.push('Practice more — you can do it!');

        await DashboardMetrics.findOneAndUpdate(
          { userId: s.userId },
          {
            $set: {
              role: 'student',
              metrics: {
                performanceSummary: count > 0 ? `You scored ${Math.round(avg)}% on average in ${count} exam(s).` : 'No exams yet — take one to get started!',
                suggestions,
                chartData: count > 0 ? [{ label: 'Avg Score', value: Math.round(avg), color: '#f59e0b' }] : undefined,
              },
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        result.updated++;
      } catch (err) {
        result.errors.push(String(err));
      }
    }
  } catch (err) {
    result.errors.push(String(err));
  }

  return result;
}
