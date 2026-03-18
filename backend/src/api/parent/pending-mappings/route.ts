import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { PendingEnrollment } from '@/lib/models/PendingEnrollment';
import { getAuthFromRequest } from '@/lib/auth';

/**
 * GET: Pending enrollments needing action:
 * - payment completed but student mapping not done (seat reserved)
 * - payment failed (retry CTA)
 */
export async function GET(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [completedUnmapped, failed] = await Promise.all([
      PendingEnrollment.find({
        parentId: parent._id,
        paymentStatus: 'completed',
        convertedToEnrollmentId: null,
      })
        .populate('teacherId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
      PendingEnrollment.find({
        parentId: parent._id,
        paymentStatus: 'failed',
      })
        .populate('teacherId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const pendingMappings = completedUnmapped.map((p) => {
      const teacher = p.teacherId as { name?: string } | null;
      return {
        _id: p._id,
        type: 'pending_mapping' as const,
        subject: p.subject,
        classLevel: p.classLevel,
        teacherName: teacher?.name,
      };
    });

    const paymentFailed = failed.map((p) => {
      const teacher = p.teacherId as { name?: string } | null;
      return {
        _id: p._id,
        type: 'payment_failed' as const,
        subject: p.subject,
        classLevel: p.classLevel,
        teacherName: teacher?.name,
      };
    });

    return NextResponse.json({
      pendingMappings,
      paymentFailed,
      pendings: [...pendingMappings, ...paymentFailed],
    });
  } catch (error) {
    console.error('Pending mappings error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
