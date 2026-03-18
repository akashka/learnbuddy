import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { ConsentLog } from '@/lib/models/ConsentLog';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const dataSummary: { category: string; items: string[] }[] = [];
    let consentHistory: { consentType: string; version: string; grantedAt: string; studentName?: string }[] = [];

    if (decoded.role === 'parent') {
      const parent = await Parent.findOne({ userId: decoded.userId })
        .populate('userId', 'email phone')
        .populate('children', 'name studentId')
        .lean();

      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

      dataSummary.push(
        { category: 'Account', items: ['Name', 'Email', 'Phone', 'Location'] },
        { category: 'Children', items: ['Name', 'Date of birth', 'Class', 'Board', 'School', 'Photo'] },
        { category: 'Enrollments', items: ['Teacher', 'Subject', 'Schedule', 'Payment history'] },
        { category: 'Activity', items: ['Class attendance', 'Exam results', 'Performance data'] }
      );

      const consents = await ConsentLog.find({ parentId: parent._id })
        .populate('studentId', 'name studentId')
        .sort({ grantedAt: -1 })
        .limit(50)
        .lean();

      consentHistory = consents.map((c) => ({
        consentType: c.consentType,
        version: c.version,
        grantedAt: c.grantedAt?.toISOString() || '',
        studentName: (c.studentId as { name?: string })?.name || (c.studentId as { studentId?: string })?.studentId,
      }));
    } else if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId })
        .populate('userId', 'email')
        .lean();

      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

      dataSummary.push(
        { category: 'Account', items: ['Name', 'Email', 'Phone', 'Qualification', 'Bio'] },
        { category: 'Professional', items: ['Board', 'Classes', 'Subjects', 'Documents', 'Bank details'] },
        { category: 'Activity', items: ['Batches', 'Classes conducted', 'Payment history'] }
      );
    }

    return NextResponse.json({
      dataSummary,
      consentHistory,
    });
  } catch (error) {
    console.error('Privacy dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load privacy data' }, { status: 500 });
  }
}
