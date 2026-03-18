import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id)
      .populate('userId', 'email isActive')
      .populate('parentId', 'name phone')
      .populate({ path: 'enrollments', populate: { path: 'teacherId', select: 'name' } })
      .lean();

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json(student);
  } catch (error) {
    console.error('Student detail error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = (await request.json()) as any;
    const { name, classLevel, schoolName, board, photoUrl, idProofUrl } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (classLevel !== undefined) update.classLevel = classLevel;
    if (schoolName !== undefined) update.schoolName = schoolName;
    if (board !== undefined) update.board = board;
    if (photoUrl !== undefined) update.photoUrl = photoUrl;
    if (idProofUrl !== undefined) update.idProofUrl = idProofUrl;

    const student = await Student.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('userId', 'email isActive')
      .populate('parentId', 'name phone')
      .lean();

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json(student);
  } catch (error) {
    console.error('Student update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
