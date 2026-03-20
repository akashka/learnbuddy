import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { User } from '@/lib/models/User';
import { generateStudyMaterial } from '@/lib/ai';
import { saveAIGeneratedContent } from '@/lib/ai-data-store';
import { getAuthFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';
import { logAIUsage } from '@/lib/ai-audit';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as Record<string, unknown>;
    const subject = String(body.subject ?? '');
    const board = String(body.board ?? '');
    const classLevel = String(body.classLevel ?? '');
    const topic = String(body.topic ?? '');
    const includeFlashcards = true; // Always include flashcards

    if (!subject || !board || !classLevel || !topic) {
      return NextResponse.json({ error: 'Subject, board, classLevel and topic required' }, { status: 400 });
    }

    if (decoded.role === 'student') {
      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const enrollment = await Enrollment.findOne({
        studentId: student._id,
        status: 'active',
        subject,
        board,
        classLevel,
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Study material only for subjects you have tuition for' }, { status: 403 });
      }
    } else {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const hasCombo = teacher.board.includes(board) && teacher.classes.includes(classLevel) && teacher.subjects.includes(subject);
      if (!hasCombo) {
        return NextResponse.json({ error: 'Study material only for subjects you teach' }, { status: 403 });
      }
    }

    const start = Date.now();
    let material;
    try {
      material = await generateStudyMaterial(subject, topic, board, classLevel, {
        includeFlashcards,
      });
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_study_material',
        userId: decoded.userId,
        userRole: decoded.role,
        inputMetadata: { subject, topic, board, classLevel },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_study_material',
      userId: decoded.userId,
      userRole: decoded.role,
      inputMetadata: { subject, topic, board, classLevel },
      outputMetadata: {
        title: material.title,
        sectionCount: material.sections?.length ?? 0,
        flashcardCount: material.flashcards?.length ?? 0,
      },
      durationMs: Date.now() - start,
      success: true,
    });
    const contentId = await saveAIGeneratedContent({
      type: 'resource',
      board,
      classLevel,
      subject,
      topic,
      content: {
        title: material.title,
        summary: material.summary,
        sections: material.sections,
        flashcards: material.flashcards,
      },
      requestedBy: decoded.userId as any,
      requesterRole: decoded.role as 'student' | 'teacher',
    });

    // When student generates AI content, notify parent and teacher
    if (decoded.role === 'student') {
      const student = await Student.findOne({ userId: decoded.userId }).select('parentId name').lean();
      const enrollment = await Enrollment.findOne({
        studentId: (student as { _id?: mongoose.Types.ObjectId })?._id,
        subject,
        board,
        classLevel,
        status: 'active',
      }).select('teacherId').lean();
      const targetUserIds: mongoose.Types.ObjectId[] = [];
      if (student?.parentId) {
        const parent = await Parent.findById(student.parentId).select('userId').lean();
        if (parent?.userId) targetUserIds.push(parent.userId as mongoose.Types.ObjectId);
      }
      if (enrollment?.teacherId) {
        const teacher = await Teacher.findById(enrollment.teacherId).select('userId').lean();
        if (teacher?.userId) targetUserIds.push(teacher.userId as mongoose.Types.ObjectId);
      }
      const studentName = (student as { name?: string })?.name || 'Your child';
      const users = await User.find({ _id: { $in: targetUserIds } }).select('_id role').lean();
      const ctaByRole: Record<string, string> = { parent: '/parent/students', teacher: '/teacher/batches' };
      for (const u of users) {
        createNotification({
          userId: u._id as mongoose.Types.ObjectId,
          type: 'ai_content_generated',
          title: 'Study material generated!',
          message: `${studentName} generated AI study material for ${topic} in ${subject}.`,
          ctaLabel: 'View',
          ctaUrl: ctaByRole[(u as { role?: string }).role || ''] || '/parent/students',
          entityType: 'enrollment',
          metadata: { topic, subject },
        }).catch((err) => console.error('Notification error:', err));
      }
    }

    return NextResponse.json({ ...material, contentId });
  } catch (error) {
    console.error('Study generate error:', error);
    return NextResponse.json({ error: 'Failed to generate material' }, { status: 500 });
  }
}
