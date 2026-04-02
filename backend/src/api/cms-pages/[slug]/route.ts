import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { CmsPage } from '@/lib/models/CmsPage';

/** Public: Get CMS page by slug. No auth required. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    await connectDB();

    const page = await CmsPage.findOne({ slug }).lean();
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    let title = page.title;
    let content = page.content;

    if (lang && page.translations && (page.translations as any)[lang]) {
      const trans = (page.translations as any)[lang];
      if (trans.title) title = trans.title;
      if (trans.content) content = trans.content;
    }

    return NextResponse.json({
      slug: page.slug,
      title,
      content,
      updatedAt: page.updatedAt,
    });
  } catch (error) {
    console.error('CMS page fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}
