import path from 'path';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/db';
import { Document } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const DOC_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/** Allowed MIME types for document uploads */
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/html',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/rtf',
  'application/json',
  'application/xml',
  'application/zip',
]);

/** Admin: Upload new version of document (retains old versions) */
export async function POST(
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Supported: PDF, Word, Excel, PowerPoint, images, text, etc.' },
        { status: 400 }
      );
    }
    if (file.size > DOC_MAX_SIZE) {
      return NextResponse.json({ error: 'File must be under 50MB' }, { status: 400 });
    }

    await connectDB();

    const doc = await Document.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(file.name) || '.bin';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/api/uploads/${filename}`;
    const nextVersion = (doc.versions?.length || 0) + 1;

    doc.versions = doc.versions || [];
    doc.versions.push({
      url,
      version: nextVersion,
      uploadedAt: new Date(),
      originalFilename: file.name,
    });
    await doc.save();

    const latest = doc.versions[doc.versions.length - 1];

    return NextResponse.json({
      id: doc._id.toString(),
      version: latest.version,
      uploadedAt: latest.uploadedAt,
      url: latest.url,
      originalFilename: latest.originalFilename,
      versionCount: doc.versions.length,
      message: `Version ${nextVersion} uploaded successfully`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin document version upload error:', msg);
    return NextResponse.json(
      { error: 'Failed to upload version', details: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
