import { NextRequest, NextResponse } from '@/lib/next-compat';
import { readFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { StudentExam } from '@/lib/models/StudentExam';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';

const RECORDINGS_DIR = path.join(process.cwd(), 'recordings');

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const file = searchParams.get('file');

    if (!examId || !file) {
      return NextResponse.json({ error: 'examId and file required' }, { status: 400 });
    }

    if (!/^[a-f0-9-]+-\d+\.(webm|mp4|ogg)$/i.test(file)) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    await connectDB();
    const exam = await StudentExam.findById(examId).populate('studentId', 'name').lean();
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const studentId = (exam.studentId as { _id?: unknown })?._id ?? exam.studentId;

    if (decoded.role === 'student') {
      const stu = await Student.findOne({ userId: decoded.userId }).select('_id').lean();
      if (!stu || String(stu._id) !== String(studentId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role === 'parent') {
      const parent = await Parent.findOne({ userId: decoded.userId });
      const sid = String(studentId);
      if (!parent || !parent.children.some((c) => c.toString() === sid)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const enrollment = exam.enrollmentId as { teacherId?: unknown } | null;
      const hasMatch = enrollment && String((enrollment as { teacherId?: unknown }).teacherId) === String(teacher._id);
      const { Enrollment } = await import('@/lib/models/Enrollment');
      const enrollmentForStudent = await Enrollment.findOne({ teacherId: teacher._id, studentId }).lean();
      if (!hasMatch && !enrollmentForStudent) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const filepath = path.join(RECORDINGS_DIR, file);
    let content: Buffer;
    try {
      content = await readFile(filepath);
    } catch {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    const mime = file.endsWith('.mp4') ? 'video/mp4' : file.endsWith('.ogg') ? 'audio/ogg' : 'video/webm';

    return NextResponse.body(content as any, {
      headers: {
        'Content-Type': mime,
        'Content-Length': content.length.toString(),
      },
    });
  } catch (error) {
    console.error('Recording play error:', error);
    return NextResponse.json({ error: 'Failed to load recording' }, { status: 500 });
  }
}
