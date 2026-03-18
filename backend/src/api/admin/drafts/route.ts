import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import { ParentRegistration } from '@/lib/models/ParentRegistration';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Teacher drafts: any registration not yet completed (no Teacher record created)
    const teacherDrafts = await TeacherRegistration.find({
      $or: [
        { teacherId: { $exists: false } },
        { teacherId: null },
      ],
    })
      .sort({ lastSavedAt: -1 })
      .lean();

    const parentDrafts = await ParentRegistration.find({ isComplete: false })
      .sort({ lastSavedAt: -1 })
      .lean();

    return NextResponse.json({
      teacherDrafts,
      parentDrafts,
    });
  } catch (error) {
    console.error('Drafts error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
