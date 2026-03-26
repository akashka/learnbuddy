import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
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

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'active',
      paymentStatus: 'completed',
    }).lean();

    const teacherIds = [...new Set(enrollments.map((e) => e.teacherId.toString()))];

    const teachers = await Teacher.find({ _id: { $in: teacherIds } })
      .select('name photoUrl qualification bio subjects board classes experienceMonths languages gender batches')
      .lean();

    const teacherMap = new Map(teachers.map((t) => [t._id.toString(), t]));

    const result = teacherIds.map((tid) => {
      const teacher = teacherMap.get(tid);
      if (!teacher) return null;

      // Gather courses from enrollments for this teacher
      const myEnrollments = enrollments.filter((e) => e.teacherId.toString() === tid);
      const courses = myEnrollments.map((e) => ({
        subject: e.subject,
        board: e.board,
        classLevel: e.classLevel,
        slots: e.slots,
        feePerMonth: e.feePerMonth,
        startDate: e.startDate,
        endDate: e.endDate,
      }));

      return {
        _id: teacher._id,
        name: teacher.name,
        photoUrl: teacher.photoUrl,
        qualification: teacher.qualification,
        bio: teacher.bio,
        subjects: teacher.subjects,
        board: teacher.board,
        classes: teacher.classes,
        experienceMonths: teacher.experienceMonths,
        languages: teacher.languages,
        gender: teacher.gender,
        courses,
      };
    }).filter(Boolean);

    return NextResponse.json({ teachers: result });
  } catch (error) {
    console.error('Student my-teachers error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
