import path from 'path';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/db';
import { JobPosition } from '@/lib/models/JobPosition';
import { getAuthFromRequest } from '@/lib/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const JD_MAX_SIZE = 25 * 1024 * 1024; // 25MB

/** Admin: Upload JD for job position */
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
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const formData = await request.formData();
    const jdFile = formData.get('jd') as File | null;

    if (!jdFile || jdFile.size === 0) {
      return NextResponse.json({ error: 'JD file is required' }, { status: 400 });
    }
    if (jdFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    if (jdFile.size > JD_MAX_SIZE) {
      return NextResponse.json({ error: 'JD file must be under 25MB' }, { status: 400 });
    }

    await connectDB();
    const position = await JobPosition.findById(id);
    if (!position) return NextResponse.json({ error: 'Position not found' }, { status: 404 });

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${uuidv4()}.pdf`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await jdFile.arrayBuffer());
    await writeFile(filepath, buffer);

    const jdUrl = `/api/uploads/${filename}`;
    position.jdUrl = jdUrl;
    await position.save();

    return NextResponse.json({
      jdUrl,
      message: 'JD uploaded successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Admin JD upload error:', msg, stack);
    return NextResponse.json(
      { error: 'Failed to upload', details: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
