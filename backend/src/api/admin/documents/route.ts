import path from 'path';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/db';
import { Document, DocumentFolder } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const DOC_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/** Allowed MIME types for document uploads - covers most common file types */
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

/** Admin: List documents and folders */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || '';

    await connectDB();

    const folders = await DocumentFolder.find({ parentId: folderId || null })
      .sort({ order: 1, name: 1 })
      .lean();

    const documents = await Document.find({ folderId: folderId || null })
      .sort({ order: 1, name: 1 })
      .lean();

    return NextResponse.json({
      folders: folders.map((f) => ({
        id: f._id.toString(),
        name: f.name,
        parentId: f.parentId?.toString() || null,
        allowedRoles: f.allowedRoles,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      documents: documents.map((d) => {
        const latest = d.versions?.length ? d.versions[d.versions.length - 1] : null;
        return {
          id: d._id.toString(),
          name: d.name,
          folderId: d.folderId?.toString() || null,
          category: d.category,
          allowedRoles: d.allowedRoles,
          versionCount: d.versions?.length || 0,
          latestVersion: latest
            ? {
                version: latest.version,
                uploadedAt: latest.uploadedAt,
                url: latest.url,
                originalFilename: latest.originalFilename,
              }
            : null,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Admin documents fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

/** Admin: Create new document with file upload */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || 'General';
    const folderId = (formData.get('folderId') as string)?.trim() || null;
    const allowedRolesStr = (formData.get('allowedRoles') as string) || 'admin,teacher,parent,student';
    const file = formData.get('file') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
    }
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Supported: PDF, Word, Excel, PowerPoint, images, text, etc.` },
        { status: 400 }
      );
    }
    if (file.size > DOC_MAX_SIZE) {
      return NextResponse.json({ error: 'File must be under 50MB' }, { status: 400 });
    }

    const allowedRoles = allowedRolesStr.split(',').map((r) => r.trim()).filter(Boolean);
    if (allowedRoles.length === 0) allowedRoles.push('admin', 'teacher', 'parent', 'student');

    await connectDB();

    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(file.name) || '.bin';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/api/uploads/${filename}`;
    const doc = await Document.create({
      name,
      folderId: folderId || null,
      category,
      allowedRoles,
      versions: [
        {
          url,
          version: 1,
          uploadedAt: new Date(),
          originalFilename: file.name,
        },
      ],
    });

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      folderId: doc.folderId?.toString() || null,
      category: doc.category,
      allowedRoles: doc.allowedRoles,
      latestVersion: {
        version: 1,
        uploadedAt: doc.versions[0].uploadedAt,
        url: doc.versions[0].url,
        originalFilename: doc.versions[0].originalFilename,
      },
      message: 'Document created successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin document create error:', msg);
    return NextResponse.json(
      { error: 'Failed to create document', details: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
