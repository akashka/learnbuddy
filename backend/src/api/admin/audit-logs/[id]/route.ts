import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/** GET - Fetch single audit log entry (admin only) */
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

    const log = await AuditLog.findById(id).lean();
    if (!log) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('Admin audit log detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
