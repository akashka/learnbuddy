import { NextRequest, NextResponse } from '@/lib/next-compat';
import { getAuthFromRequest, getTokenFromRequest } from '@/lib/auth';
import { addToBlacklist } from '@/lib/tokenBlacklist';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = getAuthFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await addToBlacklist(token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
