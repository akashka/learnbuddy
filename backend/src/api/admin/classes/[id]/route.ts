import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
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

    const session = await ClassSession.findById(id)
      .populate('enrollmentId', 'subject batchId classLevel slots')
      .populate('teacherId', 'name phone')
      .populate('studentId', 'name studentId')
      .populate('studentIds', 'name studentId')
      .populate('enrollmentIds', 'subject batchId')
      .lean();

    if (!session) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Class session get error:', error);
    return NextResponse.json({ error: 'Failed to get class session' }, { status: 500 });
  }
}
