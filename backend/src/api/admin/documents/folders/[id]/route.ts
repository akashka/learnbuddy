import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DocumentFolder } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/** Admin: Get folder by ID (for breadcrumb/parent navigation) */
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
      return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
    }

    await connectDB();

    const folder = await DocumentFolder.findById(id).lean();
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId?.toString() || null,
      allowedRoles: folder.allowedRoles,
    });
  } catch (error) {
    console.error('Admin folder get error:', error);
    return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 });
  }
}
