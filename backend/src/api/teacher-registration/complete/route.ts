import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import { Teacher } from '@/lib/models/Teacher';
import { User } from '@/lib/models/User';
import { verifyTeacherRegistrationSession } from '@/lib/teacher-registration-session';
import { generateToken } from '@/lib/auth';
import { cacheInvalidatePattern } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const { phone } = (await request.json()) || {};

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    if (!verifyTeacherRegistrationSession(request, phone)) {
      return NextResponse.json({ error: 'Session expired. Please verify your number again.' }, { status: 401 });
    }

    await connectDB();
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const reg = await TeacherRegistration.findOne({ phone: normalizedPhone });

    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (reg.status !== 'qualified') {
      return NextResponse.json({ error: 'Must pass exam first' }, { status: 400 });
    }

    if (reg.teacherId && reg.userId) {
      const userDoc = await User.findById(reg.userId).lean();
      const token = generateToken(reg.userId.toString(), 'teacher');
      return NextResponse.json({
        teacherId: reg.teacherId,
        alreadyCreated: true,
        token,
        user: { id: String(reg.userId), email: userDoc?.email || reg.step1Data?.email, role: 'teacher' },
        teacherName: reg.step1Data?.name,
      });
    }

    const step1 = reg.step1Data;
    const step2 = reg.step2Data;
    const step4 = reg.step4Data;
    const step5 = reg.step5Data;

    if (!step1?.email || !reg.userId) {
      return NextResponse.json({ error: 'Incomplete registration' }, { status: 400 });
    }

    let userId = reg.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User not created' }, { status: 400 });
    }

    const combinations = step2?.combinations || [];
    const batchList = step5?.batches || [];
    const boards = [...new Set([
      ...combinations.map((c: { board: string }) => c.board),
      ...batchList.map((b: { board: string }) => b.board),
    ])].filter(Boolean);
    const classes = [...new Set([
      ...combinations.map((c: { classLevel: string }) => c.classLevel),
      ...batchList.map((b: { classLevel: string }) => b.classLevel),
    ])].filter(Boolean);
    const subjects = [...new Set([
      ...combinations.map((c: { subject: string }) => c.subject),
      ...batchList.map((b: { subject: string }) => b.subject),
    ])].filter(Boolean);

    const today = new Date();
    const minStartDate = new Date(today);
    minStartDate.setDate(minStartDate.getDate() + 1);
    const maxStartDate = new Date(today);
    maxStartDate.setDate(maxStartDate.getDate() + 30);

    const batches = (step5?.batches || []).map((b: { name: string; board: string; classLevel: string; subject: string; minStudents: number; maxStudents: number; feePerMonth: number; slots: { day: string; startTime: string; endTime: string }[]; startDate?: string }) => {
      let startDate: Date = minStartDate;
      if (b.startDate) {
        const d = new Date(b.startDate);
        d.setHours(0, 0, 0, 0);
        if (d >= minStartDate && d <= maxStartDate) startDate = d;
      }
      return {
        name: b.name,
        board: b.board,
        classLevel: b.classLevel,
        subject: b.subject,
        minStudents: b.minStudents || 1,
        maxStudents: b.maxStudents || 3,
        feePerMonth: b.feePerMonth || 2000,
        slots: (b.slots || []) as { day: string; startTime: string; endTime: string }[],
        isActive: true,
        startDate,
      };
    });

    const lastAttempt = reg.step3Data?.examAttempts?.slice(-1)[0];
    const score = lastAttempt?.score ?? 0;
    const aiExamPerformance = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    const teacher = await Teacher.create({
      userId,
      name: step1.name,
      phone: normalizedPhone,
      photoUrl: reg.profilePhotoUrl,
      board: boards,
      classes,
      subjects,
      status: 'qualified',
      qualificationExamAttempts: reg.examAttempts,
      lastQualificationAttempt: reg.lastExamAttemptAt,
      aiExamPerformance,
      documents: (step4?.documents || []).map((d: { type: string; url: string }) => ({ name: d.type, url: d.url })),
      batches,
      demoVideoUrl: undefined,
      bankDetails: (step4 as { bankDetails?: { accountNumber?: string; ifsc?: string; bankName?: string } })?.bankDetails,
    });

    await TeacherRegistration.findByIdAndUpdate(reg._id, { teacherId: teacher._id });
    await cacheInvalidatePattern('marketplace:*');

    const userDoc = await User.findById(userId).lean();
    const token = generateToken(userId.toString(), 'teacher');

    return NextResponse.json({
      teacherId: teacher._id,
      success: true,
      token,
      user: { id: String(userId), email: userDoc?.email || step1.email, role: 'teacher' },
      teacherName: step1.name,
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    return NextResponse.json({ error: 'Failed to complete' }, { status: 500 });
  }
}
