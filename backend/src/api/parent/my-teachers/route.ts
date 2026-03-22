import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherReview } from '@/lib/models/TeacherReview';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrollments = await Enrollment.find({
      studentId: { $in: parent.children },
      paymentStatus: 'completed',
      status: 'active',
    })
      .populate('teacherId', 'name photoUrl qualification subjects classes board')
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const teacherIds = [...new Set(enrollments.map((e) => String((e.teacherId as { _id?: unknown })?._id)).filter(Boolean))];
    const teachers = await Teacher.find({ _id: { $in: teacherIds } })
      .select('name photoUrl qualification subjects classes board bio')
      .lean();

    const reviews = await TeacherReview.find({
      parentId: parent._id,
      teacherId: { $in: teacherIds },
    }).lean();

    const reviewMap = Object.fromEntries(reviews.map((r) => [String(r.teacherId), r]));

    type CourseEntry = {
      enrollmentId: string;
      subject: string;
      board: string;
      classLevel: string;
      studentName?: string;
      studentId: string;
      feePerMonth: number;
      teacherChangeCount: number;
      canSwitch: boolean;
    };

    const teacherEnrollmentsMap = new Map<string, CourseEntry[]>();
    const MAX_TEACHER_CHANGES = 2;
    for (const e of enrollments) {
      const tid = String((e.teacherId as { _id?: unknown })?._id);
      if (!tid) continue;
      const existing = teacherEnrollmentsMap.get(tid) || [];
      const studentName = (e.studentId as { name?: string })?.name;
      const studentId = String((e.studentId as { _id?: unknown })?._id);
      const changeCount = (e as { teacherChangeCount?: number }).teacherChangeCount ?? 0;
      existing.push({
        enrollmentId: String(e._id),
        subject: e.subject || '',
        board: e.board || '',
        classLevel: e.classLevel || '',
        studentName,
        studentId,
        feePerMonth: e.feePerMonth ?? 0,
        teacherChangeCount: changeCount,
        canSwitch: changeCount < MAX_TEACHER_CHANGES,
      });
      teacherEnrollmentsMap.set(tid, existing);
    }

    const myTeachers = teachers.map((t) => {
      const tid = String(t._id);
      const review = reviewMap[tid];
      const courses = teacherEnrollmentsMap.get(tid) || [];
      return {
        _id: tid,
        name: t.name,
        photoUrl: t.photoUrl,
        qualification: t.qualification,
        subjects: t.subjects,
        classes: t.classes,
        board: t.board,
        bio: t.bio,
        courses,
        myReview: review
          ? {
              rating: review.rating,
              review: review.review,
              createdAt: review.createdAt,
              updatedAt: (review as { updatedAt?: Date }).updatedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ teachers: myTeachers });
  } catch (error) {
    console.error('Parent my-teachers error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
