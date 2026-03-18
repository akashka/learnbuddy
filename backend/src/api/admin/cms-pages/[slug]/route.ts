import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { CmsPage } from '@/lib/models/CmsPage';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Get single CMS page */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    await connectDB();

    const page = await CmsPage.findOne({ slug }).lean();
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Admin CMS page fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

/** Admin: Update CMS page (create if not exists) */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    await connectDB();

    const page = await CmsPage.findOneAndUpdate(
      { slug },
      { title: title.trim(), content: typeof content === 'string' ? content : '' },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json(page);
  } catch (error) {
    console.error('Admin CMS page update error:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}
