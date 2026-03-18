import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(
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

    let teacherId: mongoose.Types.ObjectId;
    try {
      teacherId = new mongoose.Types.ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    if (teacher.bgvVerified) {
      return NextResponse.json({ error: 'BGV already approved for this teacher' }, { status: 400 });
    }

    const adminUserId = new mongoose.Types.ObjectId(decoded.userId);
    teacher.bgvVerified = true;
    teacher.bgvApprovedBy = adminUserId;
    teacher.bgvApprovedAt = new Date();
    await teacher.save();

    const updated = await Teacher.findById(teacherId)
      .populate('bgvApprovedBy', 'email')
      .select('-__v')
      .lean();

    return NextResponse.json({
      ...updated,
      bgvApprovedByEmail: (updated?.bgvApprovedBy as { email?: string })?.email,
    });
  } catch (error) {
    console.error('BGV approval error:', error);
    return NextResponse.json({ error: 'Failed to approve BGV' }, { status: 500 });
  }
}
