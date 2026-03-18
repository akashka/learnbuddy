import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { Parent } from '@/lib/models/Parent';
import { Enrollment } from '@/lib/models/Enrollment';
import { User } from '@/lib/models/User';
import { answerDoubt } from '@/lib/ai';
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
    const body = (await request.json()) as any;
    const { question, subject, board, classLevel, topic } = body;

    if (!question || !subject || !board || !classLevel) {
      return NextResponse.json({ error: 'Question, subject, board and classLevel required' }, { status: 400 });
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
        return NextResponse.json({ error: 'Doubt center only for subjects you have tuition for' }, { status: 403 });
      }
    } else {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const hasCombo = teacher.board.includes(board) && teacher.classes.includes(classLevel) && teacher.subjects.includes(subject);
      if (!hasCombo) {
        return NextResponse.json({ error: 'Doubt center only for subjects you teach' }, { status: 403 });
      }
    }

    const start = Date.now();
    let doubtResult: { answer: string; questionWarning?: boolean; answerWarning?: boolean; sentimentScore?: number };
    try {
      doubtResult = await answerDoubt(question, { subject, topic: topic || 'General', board, classLevel });
    } catch (err) {
      await logAIUsage({
        operationType: 'answer_doubt',
        userId: decoded.userId,
        userRole: decoded.role,
        inputMetadata: { subject, topic: topic || 'General', board, classLevel, questionLength: String(question).length },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'answer_doubt',
      userId: decoded.userId,
      userRole: decoded.role,
      inputMetadata: { subject, topic: topic || 'General', board, classLevel, questionLength: String(question).length },
      outputMetadata: { answerLength: String(doubtResult.answer).length, sentimentScore: doubtResult.sentimentScore },
      durationMs: Date.now() - start,
      success: true,
    });
    await saveAIGeneratedContent({
      type: 'doubt_answer',
      board,
      classLevel,
      subject,
      topic: topic || 'General',
      question,
      content: {
        answer: doubtResult.answer,
        sentimentScore: doubtResult.sentimentScore,
        questionWarning: doubtResult.questionWarning,
        answerWarning: doubtResult.answerWarning,
      },
      requestedBy: decoded.userId as any,
      requesterRole: decoded.role as 'student' | 'teacher',
    });

    // When student asks doubt (AI content), notify parent and teacher
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
          title: 'Doubt answered!',
          message: `${studentName} asked a doubt in ${subject} and got an AI answer.`,
          ctaLabel: 'View',
          ctaUrl: ctaByRole[(u as { role?: string }).role || ''] || '/parent/students',
          entityType: 'enrollment',
          metadata: { topic: topic || 'General', subject },
        }).catch((err) => console.error('Notification error:', err));
      }
    }

    return NextResponse.json({
      answer: doubtResult.answer,
      questionWarning: doubtResult.questionWarning,
      answerWarning: doubtResult.answerWarning,
      sentimentScore: doubtResult.sentimentScore,
    });
  } catch (error) {
    console.error('Study ask error:', error);
    return NextResponse.json({ error: 'Failed to get answer' }, { status: 500 });
  }
}
