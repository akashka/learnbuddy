import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Document } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/** Admin: Get document details with all versions */
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
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    await connectDB();

    const doc = await Document.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const latest = doc.versions?.length ? doc.versions[doc.versions.length - 1] : null;

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      folderId: doc.folderId?.toString() || null,
      category: doc.category,
      allowedRoles: doc.allowedRoles,
      versions: (doc.versions || []).map((v) => ({
        version: v.version,
        uploadedAt: v.uploadedAt,
        url: v.url,
        originalFilename: v.originalFilename,
      })),
      latestVersion: latest
        ? {
            version: latest.version,
            uploadedAt: latest.uploadedAt,
            url: latest.url,
            originalFilename: latest.originalFilename,
          }
        : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error('Admin document get error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

/** Admin: Update document metadata (name, category, allowedRoles) */
export async function PATCH(
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
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const body = (await request.json()) as any;
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.category === 'string') updates.category = body.category.trim() || 'General';
    if (typeof body.folderId === 'string') updates.folderId = body.folderId.trim() || null;
    if (Array.isArray(body.allowedRoles)) updates.allowedRoles = body.allowedRoles;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    await connectDB();

    const doc = await Document.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      folderId: doc.folderId?.toString() || null,
      category: doc.category,
      allowedRoles: doc.allowedRoles,
      message: 'Document updated',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin document update error:', msg);
    return NextResponse.json(
      { error: 'Failed to update document', details: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}

/** Admin: Delete document */
export async function DELETE(
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
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    await connectDB();

    const doc = await Document.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Admin document delete error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
