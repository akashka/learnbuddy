import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AIGeneratedContent } from '@/lib/models/AIGeneratedContent';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

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

    const item = await AIGeneratedContent.findById(id)
      .populate('adminFeedback.flaggedBy', 'name email')
      .lean();

    if (!item) {
      return NextResponse.json({ error: 'AI content not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Admin AI data get error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { whatWasWrong } = body;

    if (!whatWasWrong || typeof whatWasWrong !== 'string' || !whatWasWrong.trim()) {
      return NextResponse.json({ error: 'Feedback text required' }, { status: 400 });
    }

    await connectDB();

    const staff = await AdminStaff.findOne({ userId: decoded.userId }).select('_id').lean();
    const feedbackEntry = {
      whatWasWrong: whatWasWrong.trim(),
      flaggedAt: new Date(),
      flaggedBy: staff?._id ?? null,
    };

    const item = await AIGeneratedContent.findByIdAndUpdate(
      id,
      { $push: { adminFeedback: feedbackEntry } },
      { new: true }
    )
      .populate('adminFeedback.flaggedBy', 'name email')
      .lean();

    if (!item) {
      return NextResponse.json({ error: 'AI content not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Admin AI data feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
