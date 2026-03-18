import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { AIUsageLog } from '@/lib/models/AIUsageLog';
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

/** GET - Single AI usage log detail (admin only) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: 'Invalid log ID' }, { status: 400 });
    }

    await connectDB();

    const log = await AIUsageLog.findById(id)
      .populate('userId', 'email phone')
      .lean();

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('Admin AI usage log detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 });
  }
}
