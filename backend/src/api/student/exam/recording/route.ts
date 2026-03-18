import { NextRequest, NextResponse } from '@/lib/next-compat';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { getAuthFromRequest } from '@/lib/auth';

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings');

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const formData = await request.formData();
    const examId = formData.get('examId') as string;
    const file = formData.get('recording') as File | null;

    if (!examId || !file) {
      return NextResponse.json({ error: 'examId and recording file required' }, { status: 400 });
    }

    const exam = await StudentExam.findOne({ _id: examId, studentId: student._id });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    await mkdir(RECORDINGS_DIR, { recursive: true });

    const ext = file.name.split('.').pop() || 'webm';
    const filename = `${examId}-${Date.now()}.${ext}`;
    const filepath = path.join(RECORDINGS_DIR, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const recordingUrl = `/api/student/exam/recording/play?examId=${examId}&file=${filename}`;

    await StudentExam.findByIdAndUpdate(examId, { recordingUrl });

    return NextResponse.json({ success: true, recordingUrl });
  } catch (error) {
    console.error('Recording upload error:', error);
    return NextResponse.json({ error: 'Failed to upload recording' }, { status: 500 });
  }
}
