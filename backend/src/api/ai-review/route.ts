import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { AIReviewRequest } from '@/lib/models/AIReviewRequest';
import { Student } from '@/lib/models/Student';
import { Parent } from '@/lib/models/Parent';
import { Teacher } from '@/lib/models/Teacher';
import { User } from '@/lib/models/User';
import { StudentExam } from '@/lib/models/StudentExam';
import { getAuthFromRequest } from '@/lib/auth';
import { createNotificationsForUsers } from '@/lib/notification-service';

/** POST - Submit a human review request */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'teacher', 'parent'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { entityType, entityId, remark, studentId } = body;

    if (!entityType || !entityId || !remark) {
      return NextResponse.json(
        { error: 'entityType, entityId, and remark are required' },
        { status: 400 }
      );
    }

    if (!['exam', 'course_material'].includes(entityType)) {
      return NextResponse.json({ error: 'entityType must be exam or course_material' }, { status: 400 });
    }

    if (remark.trim().length < 10) {
      return NextResponse.json({ error: 'Remark must be at least 10 characters' }, { status: 400 });
    }

    const id = mongoose.Types.ObjectId.isValid(entityId) ? new mongoose.Types.ObjectId(entityId) : null;
    if (!id) {
      return NextResponse.json({ error: 'Invalid entityId' }, { status: 400 });
    }

    // Verify user has access to the entity
    if (entityType === 'exam') {
      const exam = await StudentExam.findById(id).lean();
      if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

      const examStudentId = String((exam.studentId as { _id?: unknown })?._id ?? exam.studentId);

      if (decoded.role === 'student') {
        const stu = await Student.findOne({ userId: decoded.userId }).select('_id').lean();
        if (!stu || String(stu._id) !== examStudentId) {
          return NextResponse.json({ error: 'You can only request review for your own exams' }, { status: 403 });
        }
      } else if (decoded.role === 'parent') {
        const parent = await Parent.findOne({ userId: decoded.userId });
        if (!parent || !parent.children.some((c) => c.toString() === examStudentId)) {
          return NextResponse.json({ error: 'You can only request review for your child\'s exams' }, { status: 403 });
        }
      } else if (decoded.role === 'teacher') {
        const teacher = await Teacher.findOne({ userId: decoded.userId });
        const { Enrollment } = await import('@/lib/models/Enrollment');
        const enrollment = await Enrollment.findOne({ teacherId: teacher?._id, studentId: examStudentId }).lean();
        if (!teacher || !enrollment) {
          return NextResponse.json({ error: 'You can only request review for exams of your students' }, { status: 403 });
        }
      }
    }
    // For course_material, we allow any student/teacher who has access (simplified: just check auth)

    // Check for existing pending/in_review request for same entity
    const existing = await AIReviewRequest.findOne({
      entityType,
      entityId: id,
      raisedBy: decoded.userId,
      status: { $in: ['pending', 'in_review'] },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending review request for this item' },
        { status: 400 }
      );
    }

    const review = await AIReviewRequest.create({
      entityType,
      entityId: id,
      raisedBy: decoded.userId,
      raisedByRole: decoded.role as 'student' | 'teacher' | 'parent',
      studentId: decoded.role === 'parent' && studentId ? studentId : undefined,
      remark: remark.trim(),
      status: 'pending',
    });

    // Notify all admin users
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const adminIds = admins.map((a) => a._id as mongoose.Types.ObjectId).filter(Boolean);
    if (adminIds.length > 0) {
      await createNotificationsForUsers(adminIds, {
        type: 'ai_review_requested',
        title: 'New AI Review Request',
        message: `A ${decoded.role} has requested human review for "${entityType === 'exam' ? 'an exam' : 'course material'}".`,
        ctaLabel: 'Review',
        ctaUrl: '/ai-review-requests',
        entityType: 'ai_review',
        entityId: String(review._id),
        metadata: { entityType, entityId: String(entityId) },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your review request has been submitted. An admin will review it shortly.',
        request: review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('AI review request create error:', error);
    return NextResponse.json({ error: 'Failed to submit review request' }, { status: 500 });
  }
}

/** GET - List own review requests for student, teacher, parent */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || !['student', 'teacher', 'parent'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const query: Record<string, unknown> = { raisedBy: decoded.userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      AIReviewRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIReviewRequest.countDocuments(query),
    ]);

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('AI review list error:', error);
    return NextResponse.json({ error: 'Failed to list review requests' }, { status: 500 });
  }
}
