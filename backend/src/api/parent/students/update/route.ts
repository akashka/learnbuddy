import { NextRequest, NextResponse } from '@/lib/next-compat';
import { getAuthFromRequest } from '@/lib/auth';

/**
 * Parent-initiated learner profile updates are disabled.
 * Profiles are fixed at creation; use admin/support for corrections.
 */
export async function PUT(_request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          'Learner profiles cannot be changed after they are created. Contact support if you need help.',
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('Parent student update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
