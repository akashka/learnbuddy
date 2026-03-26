import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { AIReviewRequest } from '@/lib/models/AIReviewRequest';
import { StudentExam } from '@/lib/models/StudentExam';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';
import { sendTemplatedEmail } from '@/lib/mailgun-service';

function getIdFromRequest(request: NextRequest): string | null {
  try {
    const url = new URL(request.url || '', 'http://localhost');
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];
    return id && mongoose.Types.ObjectId.isValid(id) ? id : null;
  } catch {
    return null;
  }
}

/** GET - Get single review request with entity details (admin) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const review = await AIReviewRequest.findById(id)
      .populate('raisedBy', 'email phone')
      .populate('studentId', 'name classLevel')
      .populate('reviewedBy', 'email')
      .lean();

    if (!review) {
      return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
    }

    // Fetch entity details for display
    let entityDetails: Record<string, unknown> | null = null;
    if (review.entityType === 'exam') {
      const exam = await StudentExam.findById(review.entityId).lean();
      if (exam) entityDetails = exam as unknown as Record<string, unknown>;
    } else if (review.entityType === 'course_material') {
      const content = await AIGeneratedContent.findById(review.entityId).lean();
      if (content) entityDetails = content as unknown as Record<string, unknown>;
    }

    return NextResponse.json({ ...review, entityDetails });
  } catch (error) {
    console.error('Admin AI review get error:', error);
    return NextResponse.json({ error: 'Failed to get review request' }, { status: 500 });
  }
}

/** PATCH - Resolve review (admin): fix content/marks, mark correct/incorrect */
export async function PATCH(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const body = (await request.json()) as any;
    const {
      status,
      adminReply,
      correctedScore,
      correctedContent,
    } = body;

    if (!status || !['resolved_correct', 'resolved_incorrect'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be resolved_correct or resolved_incorrect' },
        { status: 400 }
      );
    }

    const review = await AIReviewRequest.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
    }

    if (review.status !== 'pending' && review.status !== 'in_review') {
      return NextResponse.json({ error: 'Review already resolved' }, { status: 400 });
    }

    // If admin corrected score or content, apply to entity
    if (review.entityType === 'exam' && correctedScore !== undefined) {
      await StudentExam.findByIdAndUpdate(review.entityId, {
        $set: { score: correctedScore },
      });
    }
    if (review.entityType === 'course_material' && correctedContent) {
      await AIGeneratedContent.findByIdAndUpdate(review.entityId, {
        $set: { content: correctedContent },
      });
    }

    const updated = await AIReviewRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          adminReply: adminReply || '',
          correctedScore: correctedScore ?? review.correctedScore,
          correctedContent: correctedContent ?? review.correctedContent,
          reviewedBy: decoded.userId,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('raisedBy', 'email phone')
      .populate('studentId', 'name')
      .lean();

    // Notify the user who raised the request
    const raisedByUserId = review.raisedBy as mongoose.Types.ObjectId;
    if (raisedByUserId) {
      const raisedByUser = await User.findById(raisedByUserId).select('role email').lean();
      const role = (raisedByUser as { role?: string })?.role;
      const ctaPath = role === 'parent' ? '/parent/review-requests' : role === 'teacher' ? '/teacher/review-requests' : '/student/review-requests';
      const appUrl = process.env.APP_URL || process.env.BACKEND_URL || 'https://learnbuddy.com';
      const ctaUrlFull = `${appUrl}${ctaPath}`;
      const resolutionMessage = status === 'resolved_correct'
        ? 'The admin found the AI result was correct.'
        : 'The admin has made corrections and updated the content/marks.';
      await createNotification({
          userId: raisedByUserId,
          type: 'ai_review_resolved',
          title: 'AI Review Completed',
          message: status === 'resolved_correct'
            ? 'Your review request has been reviewed. The admin found the AI result was correct.'
            : 'Your review request has been reviewed. The admin has made corrections and updated the content/marks.',
          ctaLabel: 'View Details',
          ctaUrl: ctaPath,
          entityType: 'ai_review',
          entityId: id,
          metadata: { status, adminReply },
        });
      let email: string | null = (raisedByUser as { email?: string })?.email || null;
      if (role === 'student' && raisedByUserId) {
        const { Student } = await import('@/lib/models/Student');
        const student = await Student.findOne({ userId: raisedByUserId }).populate('parentId', 'userId').lean();
        const parent = student?.parentId as { userId?: mongoose.Types.ObjectId } | null;
        if (parent?.userId) {
          const parentUser = await User.findById(parent.userId).select('email').lean();
          email = (parentUser as { email?: string })?.email || null;
        }
      }
      if (email) {
        sendTemplatedEmail({
          to: email,
          templateCode: 'ai_review_resolved',
          variables: { resolutionMessage, ctaUrl: ctaUrlFull },
        }).catch((err) => console.error('Email error:', err));
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin AI review update error:', error);
    return NextResponse.json({ error: 'Failed to update review request' }, { status: 500 });
  }
}
