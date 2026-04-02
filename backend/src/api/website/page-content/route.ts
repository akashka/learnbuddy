import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsitePageContent } from '@/lib/models';
import { WEBSITE_PAGE_CONTENT_SEED } from '@/lib/website-page-content-seed';

/** Public: Get website page content by page type. No auth required. */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const pageType = url.searchParams.get('page');
    const lang = url.searchParams.get('lang') || 'en';

    if (!pageType) {
      return NextResponse.json(
        { error: 'Missing page parameter. Use ?page=for-you|features|how-it-works|careers|role-config|landing-sections' },
        { status: 400 }
      );
    }

    const content = await WebsitePageContent.findOne({ pageType });

    if (!content) {
      const seed = (WEBSITE_PAGE_CONTENT_SEED as any)[pageType];
      if (!seed) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      return NextResponse.json({ pageType, sections: seed });
    }

    // Locale-specific content
    const sections = (content.translations as any)?.[lang] || content.sections || (WEBSITE_PAGE_CONTENT_SEED as any)[pageType];

    return NextResponse.json({
      pageType,
      sections,
      locale: lang
    });
  } catch (error) {
    console.error('Website page-content fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
