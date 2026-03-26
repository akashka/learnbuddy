import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ClassSession } from '@/lib/models/ClassSession';
import { getAuthFromRequest } from '@/lib/auth';

/**
 * POST /api/classroom/session/transcript
 * Saves a transcript chunk to the session
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as { sessionId: string; text: string };
    if (!body.sessionId || !body.text) {
      return NextResponse.json({ error: 'sessionId and text required' }, { status: 400 });
    }

    const session = await ClassSession.findById(body.sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session not in progress' }, { status: 400 });
    }

    await ClassSession.findByIdAndUpdate(body.sessionId, {
      $push: {
        transcript: {
          text: body.text,
          timestamp: new Date(),
          role: decoded.role as 'student' | 'teacher',
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transcript save error:', error);
    return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
  }
}
