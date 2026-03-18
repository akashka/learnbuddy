import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { ContactSubmission } from '@/lib/models/ContactSubmission';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Get single contact submission */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();
    const submission = await ContactSubmission.findById(id).lean();
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: submission._id.toString(),
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      type: submission.type,
      subject: submission.subject,
      message: submission.message,
      status: submission.status,
      adminNotes: submission.adminNotes,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  } catch (error) {
    console.error('Admin contact submission get error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Update contact submission status and notes */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const status = body.status as string | undefined;
    const adminNotes = body.adminNotes as string | undefined;

    const validStatuses = ['open', 'in_process', 'closed'];
    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    await connectDB();
    const submission = await ContactSubmission.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: submission._id.toString(),
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      type: submission.type,
      subject: submission.subject,
      message: submission.message,
      status: submission.status,
      adminNotes: submission.adminNotes,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  } catch (error) {
    console.error('Admin contact submission update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
