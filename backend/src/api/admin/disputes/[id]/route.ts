import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { PaymentDispute } from '@/lib/models/PaymentDispute';
import { getAuthFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';
import { sendTemplatedEmail } from '@/lib/mailgun-service';

/** Admin: Get single dispute */
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
    const dispute = await PaymentDispute.findById(id)
      .populate('userId', 'email')
      .lean();

    if (!dispute) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Admin dispute get error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Update dispute status and notes */
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

    const body = (await request.json()) as {
      status?: string;
      adminNotes?: string;
    };
    const { status, adminNotes } = body;

    const validStatuses = ['open', 'in_review', 'resolved', 'rejected'];
    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
      if (status === 'resolved' || status === 'rejected') {
        updates.resolvedAt = new Date();
        updates.resolvedBy = decoded.userId;
      }
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    await connectDB();
    const dispute = await PaymentDispute.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate('userId', 'email')
      .lean();

    if (!dispute) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userId = (dispute.userId as { _id?: mongoose.Types.ObjectId })?._id ?? (dispute.userId as mongoose.Types.ObjectId);
    if (userId) {
      const statusLabel = status === 'resolved' ? 'Resolved' : status === 'rejected' ? 'Rejected' : status === 'in_review' ? 'In Review' : 'Updated';
      createNotification({
        userId,
        type: 'dispute_updated',
        title: `Dispute ${statusLabel}`,
        message: adminNotes
          ? `Your dispute "${dispute.subject}" has been ${statusLabel.toLowerCase()}. Admin note: ${adminNotes}`
          : `Your dispute "${dispute.subject}" has been ${statusLabel.toLowerCase()}.`,
        ctaLabel: 'View dispute',
        ctaUrl: '/disputes',
        entityType: 'dispute',
        entityId: id,
      }).catch((err) => console.error('Dispute notification error:', err));
      const userEmail = (dispute.userId as { email?: string })?.email;
      if (userEmail) {
        const appUrl = process.env.APP_URL || process.env.BACKEND_URL || 'https://learnbuddy.com';
        sendTemplatedEmail({
          to: userEmail,
          templateCode: 'dispute_updated',
          variables: { status: statusLabel, ctaUrl: `${appUrl}/disputes` },
        }).catch((err) => console.error('Email error:', err));
      }
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Admin dispute update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
