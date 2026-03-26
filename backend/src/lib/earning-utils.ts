import mongoose from 'mongoose';
import { ITeacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { ClassSession } from '@/lib/models/ClassSession';
import { TeacherEarningTransaction } from '@/lib/models/TeacherEarningTransaction';

export async function calculateTeacherProRata(teacher: ITeacher, targetDate: Date = new Date()) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth(); // 0-11
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  const periodStr = `${(month + 1).toString().padStart(2, '0')}-${year}`;
  const commissionPercent = teacher.commissionPercent ?? 10;
  const commissionMultiplier = (100 - commissionPercent) / 100;

  // 1. Get all enrollments for this teacher that are active or completed this month
  const enrollments = await Enrollment.find({
    teacherId: teacher._id,
    $or: [
      { status: 'active' },
      { status: 'completed', endDate: { $gte: startOfMonth } }
    ]
  }).lean();

  // 2. Get all class sessions for this teacher in the month
  const sessions = await ClassSession.find({
    teacherId: teacher._id,
    scheduledAt: { $gte: startOfMonth, $lte: endOfMonth }
  }).lean();

  let totalExpectedNet = 0;
  let totalProRataEarned = 0;
  let totalScheduledClasses = 0;
  let totalCompletedClasses = 0;

  const studentBreakdown = [];

  for (const enrollment of enrollments) {
    // Find sessions for this enrollment in this month
    const enrSessions = sessions.filter(s => 
      s.enrollmentIds?.map(id => id.toString()).includes(enrollment._id.toString()) ||
      s.studentIds?.map(id => id.toString()).includes(enrollment.studentId.toString()) ||
      s.enrollmentId?.toString() === enrollment._id.toString() ||
      s.studentId?.toString() === enrollment.studentId.toString()
    );

    const scheduledCount = enrSessions.length;
    if (scheduledCount === 0) continue; // No classes scheduled this month for this student

    const completedCount = enrSessions.filter(s => s.status === 'completed').length;

    const expectedNet = (enrollment.feePerMonth || 0) * commissionMultiplier;
    const proRataEarned = expectedNet * (completedCount / scheduledCount);

    totalExpectedNet += expectedNet;
    totalProRataEarned += proRataEarned;
    totalScheduledClasses += scheduledCount;
    totalCompletedClasses += completedCount;

    studentBreakdown.push({
      enrollmentId: enrollment._id,
      studentId: enrollment.studentId,
      batchId: enrollment.batchId,
      feePerMonth: enrollment.feePerMonth,
      expectedNet,
      scheduledCount,
      completedCount,
      proRataEarned
    });
  }

  // 3. Get carry overs and deductions for this period
  const transactions = await TeacherEarningTransaction.find({
    teacherId: teacher._id,
    periodStr
  }).lean();

  let topLevelCarryOver = 0;
  let topLevelDeductions = 0;
  let topLevelPayments = 0; // Payments already made in this period

  for (const t of transactions) {
    if (t.type === 'carry_over') topLevelCarryOver += t.amount;
    else if (t.type === 'deduction') topLevelDeductions += t.amount;
    else if (t.type === 'payment') topLevelPayments += t.amount; // Should ideally decrement the overall payable
  }

  // Final Payable = Pro-Rata Earned + Carry Over - Deductions - Payments Already Made
  const finalPayable = totalProRataEarned + topLevelCarryOver - topLevelDeductions - topLevelPayments;

  return {
    periodStr,
    commissionPercent,
    summary: {
      totalExpectedNet,
      totalProRataEarned,
      totalScheduledClasses,
      totalCompletedClasses,
      topLevelCarryOver,
      topLevelDeductions,
      topLevelPayments,
      finalPayable: finalPayable > 0 ? finalPayable : 0,
    },
    studentBreakdown,
    transactions // Included for passbook details combined
  };
}
