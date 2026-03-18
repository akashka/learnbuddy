import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { TeacherReview } from '@/lib/models/TeacherReview';
import { getAuthFromRequest } from '@/lib/auth';
import { analyzeSentiment, isLowSentiment, getSafeDisplayText } from '@/lib/sentiment';

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { teacherId, rating, review, enrollmentId } = body;

    if (!teacherId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'teacherId and rating (1-5) required' }, { status: 400 });
    }

    const hasEnrollment = await Enrollment.findOne({
      studentId: { $in: parent.children },
      teacherId,
      paymentStatus: 'completed',
    });
    if (!hasEnrollment) {
      return NextResponse.json({ error: 'You can only review teachers you have enrolled with' }, { status: 403 });
    }

    const existing = await TeacherReview.findOne({
      parentId: parent._id,
      teacherId,
    });

    const reviewText = typeof review === 'string' ? review.trim() : '';
    const sentimentResult = await analyzeSentiment(reviewText);

    // Reject severely inappropriate content
    if (sentimentResult.score < 0.2) {
      return NextResponse.json(
        { error: 'Your review contains inappropriate content. Please revise and try again.' },
        { status: 400 }
      );
    }

    const { text: displayText, warning } = getSafeDisplayText(reviewText, sentimentResult);
    const payload = {
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      review: reviewText,
      sentimentScore: sentimentResult.score,
      reviewDisplay: isLowSentiment(sentimentResult) ? displayText : undefined,
      enrollmentId: enrollmentId || undefined,
    };

    let doc;
    if (existing) {
      doc = await TeacherReview.findByIdAndUpdate(
        existing._id,
        { $set: payload },
        { new: true }
      );
    } else {
      doc = await TeacherReview.create({
        teacherId,
        parentId: parent._id,
        ...payload,
      });
    }

    const displayReview = doc.reviewDisplay ?? doc.review;
    return NextResponse.json({
      review: {
        _id: doc._id,
        rating: doc.rating,
        review: displayReview,
        reviewWarning: isLowSentiment(sentimentResult),
        sentimentScore: doc.sentimentScore,
        teacherId: doc.teacherId,
        createdAt: doc.createdAt,
        updatedAt: (doc as { updatedAt?: Date }).updatedAt,
      },
    });
  } catch (error) {
    console.error('Parent review error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
