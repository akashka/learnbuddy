import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Enrollment } from '@/lib/models/Enrollment';
import { ConsentLog } from '@/lib/models/ConsentLog';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).select('-password -__v').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      role: decoded.role,
      account: {
        email: user.email,
        phone: user.phone,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
    };

    if (decoded.role === 'parent') {
      const parent = await Parent.findOne({ userId: decoded.userId }).lean();
      if (parent) {
        (exportData as Record<string, unknown>).profile = {
          name: parent.name,
          phone: parent.phone,
          location: parent.location,
        };

        const children = await Student.find({ parentId: parent._id })
          .select('-__v')
          .lean();

        (exportData as Record<string, unknown>).children = children.map((c) => ({
          name: c.name,
          studentId: c.studentId,
          dateOfBirth: c.dateOfBirth,
          board: c.board,
          classLevel: c.classLevel,
          schoolName: c.schoolName,
        }));

        const enrollments = await Enrollment.find({
          studentId: { $in: children.map((c) => c._id) },
        })
          .populate('teacherId', 'name')
          .lean();

        (exportData as Record<string, unknown>).enrollments = enrollments.map((e) => ({
          subject: e.subject,
          teacher: (e.teacherId as { name?: string })?.name,
          status: e.status,
          startDate: e.startDate,
          endDate: e.endDate,
        }));

        const consents = await ConsentLog.find({ parentId: parent._id })
          .populate('studentId', 'name studentId')
          .lean();

        (exportData as Record<string, unknown>).consentHistory = consents.map((c) => ({
          consentType: c.consentType,
          version: c.version,
          grantedAt: c.grantedAt,
          studentName: (c.studentId as { name?: string })?.name,
        }));
      }
    } else if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
      if (teacher) {
        (exportData as Record<string, unknown>).profile = {
          name: teacher.name,
          phone: teacher.phone,
          qualification: teacher.qualification,
          profession: teacher.profession,
          bio: teacher.bio,
          board: teacher.board,
          classes: teacher.classes,
          subjects: teacher.subjects,
        };
      }
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Privacy export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
