import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DocumentFolder } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Create new folder */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name as string)?.trim();
    const parentId = (body.parentId as string)?.trim() || null;
    const allowedRoles = Array.isArray(body.allowedRoles)
      ? body.allowedRoles
      : ['admin', 'teacher', 'parent', 'student'];

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    await connectDB();

    const folder = await DocumentFolder.create({
      name,
      parentId: parentId || null,
      allowedRoles,
    });

    return NextResponse.json({
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId?.toString() || null,
      allowedRoles: folder.allowedRoles,
      message: 'Folder created successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin folder create error:', msg);
    return NextResponse.json(
      { error: 'Failed to create folder', details: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
