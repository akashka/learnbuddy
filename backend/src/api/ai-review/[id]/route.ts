import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { AIReviewRequest } from '@/lib/models/AIReviewRequest';
import { Student } from '@/lib/models/Student';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

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

/** GET - Get single review request (for user who raised it) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'teacher', 'parent'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const review = await AIReviewRequest.findById(id).lean();

    if (!review) {
      return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
    }

    if (String(review.raisedBy) !== String(decoded.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('AI review get error:', error);
    return NextResponse.json({ error: 'Failed to get review request' }, { status: 500 });
  }
}
