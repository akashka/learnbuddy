import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { CmsPage } from '@/lib/models/CmsPage';

/** Public: Get CMS page by slug. No auth required. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    await connectDB();

    const page = await CmsPage.findOne({ slug }).lean();
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      slug: page.slug,
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt,
    });
  } catch (error) {
    console.error('CMS page fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}
