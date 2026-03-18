import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Student } from '@/lib/models/Student';
import { Enrollment } from '@/lib/models/Enrollment';
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

    const children = await Student.find({ parentId: parent._id })
      .populate({
        path: 'enrollments',
        populate: { path: 'teacherId', select: 'name' },
      })
      .lean();

    const childrenWithEnrollments = children.map((c) => {
      const enrollments = (c.enrollments || []) as Array<{
        _id: unknown;
        subject?: string;
        teacherId?: { name?: string };
        feePerMonth?: number;
        totalAmount?: number;
        paymentStatus?: string;
        paymentId?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
        duration?: string;
      }>;
      return {
        ...c,
        enrollments: enrollments.map((e) => ({
          _id: e._id,
          subject: e.subject,
          teacher: e.teacherId,
          feePerMonth: e.feePerMonth,
          totalAmount: e.totalAmount,
          paymentStatus: e.paymentStatus,
          paymentId: e.paymentId,
          status: e.status,
          startDate: e.startDate,
          endDate: e.endDate,
          duration: e.duration,
        })),
      };
    });

    return NextResponse.json({ children: childrenWithEnrollments });
  } catch (error) {
    console.error('Parent students error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
