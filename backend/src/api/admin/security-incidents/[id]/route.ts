import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { SecurityIncident } from '@/lib/models/SecurityIncident';
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

    const incident = await SecurityIncident.findById(id)
      .populate('reportedBy', 'email')
      .lean();

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Security incident get error:', error);
    return NextResponse.json({ error: 'Failed to get incident' }, { status: 500 });
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

    await connectDB();

    const body = (await request.json()) as any;
    const {
      status,
      boardNotifiedAt,
      usersNotifiedAt,
      actionsTaken,
      affectedUserCount,
    } = body;

    const update: Record<string, unknown> = {};
    if (status !== undefined) update.status = status;
    if (boardNotifiedAt !== undefined) update.boardNotifiedAt = boardNotifiedAt ? new Date(boardNotifiedAt) : null;
    if (usersNotifiedAt !== undefined) update.usersNotifiedAt = usersNotifiedAt ? new Date(usersNotifiedAt) : null;
    if (actionsTaken !== undefined) update.actionsTaken = actionsTaken;
    if (affectedUserCount !== undefined) update.affectedUserCount = affectedUserCount;

    const incident = await SecurityIncident.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate('reportedBy', 'email')
      .lean();

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Security incident update error:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}
