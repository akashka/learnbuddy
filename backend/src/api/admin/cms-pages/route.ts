import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { CmsPage } from '@/lib/models/CmsPage';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: List all CMS pages */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const pages = await CmsPage.find().sort({ slug: 1 }).lean();

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Admin CMS pages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
