import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
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

    const pending = await PendingEnrollment.findById(id)
      .populate('parentId', 'name phone email')
      .populate({ path: 'teacherId', select: 'name batches phone' })
      .lean();

    if (!pending) {
      return NextResponse.json({ error: 'Pending enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(pending);
  } catch (error) {
    console.error('Pending enrollment get error:', error);
    return NextResponse.json({ error: 'Failed to get pending enrollment' }, { status: 500 });
  }
}
