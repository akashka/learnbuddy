import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { finalizePendingEnrollment } from '@/lib/finalize-pending-enrollment';

/**
 * Legacy / manual path: finalize enrollment after payment when extra student fields are submitted.
 * Normal checkout + payment completes enrollment automatically via payment/complete.
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as {
      pendingId?: string;
      studentId?: string;
      name?: string;
      classLevel?: string;
      schoolName?: string;
      photoUrl?: string;
      idProofUrl?: string;
    };
    const { pendingId, studentId, name, classLevel, schoolName, photoUrl, idProofUrl } = body;

    if (!pendingId) {
      return NextResponse.json({ error: 'Pending ID required' }, { status: 400 });
    }

    try {
      const result = await finalizePendingEnrollment({
        pendingId,
        parentUserId: decoded.userId,
        studentId,
        name,
        classLevel,
        schoolName,
        photoUrl,
        idProofUrl,
      });
      return NextResponse.json({
        success: true,
        studentId: result.studentDisplayId,
        enrollmentId: result.enrollmentId,
        alreadyFinalized: result.alreadyFinalized,
        message: result.message,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      const status =
        msg === 'Unauthorized' ? 401 : msg.includes('not found') || msg.includes('not linked') ? 404 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  } catch (error) {
    console.error('Student details error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
