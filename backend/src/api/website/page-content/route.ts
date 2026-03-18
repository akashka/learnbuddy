import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsitePageContent } from '@/lib/models';
import { WEBSITE_PAGE_CONTENT_SEED } from '@/lib/website-page-content-seed';

/** Public: Get website page content by page type. No auth required. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');

  if (!page) {
    return NextResponse.json(
      { error: 'Missing page parameter. Use ?page=for-you|features|how-it-works|careers|role-config|landing-sections' },
      { status: 400 }
    );
  }

  const validPages = ['for-you', 'features', 'how-it-works', 'careers', 'role-config', 'landing-sections'];
  if (!validPages.includes(page)) {
    return NextResponse.json({ error: 'Invalid page type' }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await WebsitePageContent.findOne({ pageType: page }).lean();
    const sections = doc?.sections ?? (WEBSITE_PAGE_CONTENT_SEED[page] as Record<string, unknown>);
    return NextResponse.json({ pageType: page, sections });
  } catch (error) {
    console.error('Website page-content fetch error:', error);
    const fallback = WEBSITE_PAGE_CONTENT_SEED[page];
    return NextResponse.json({ pageType: page, sections: fallback ?? {} });
  }
}
