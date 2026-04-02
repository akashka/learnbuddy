import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsitePageContent } from '@/lib/models';
import { WEBSITE_PAGE_CONTENT_SEED } from '@/lib/website-page-content-seed';

/**
 * Admin API to manage website structural sections (page-content) for different languages.
 * GET ?page=<pageType>&lang=<locale>
 * PUT body { pageType, lang, sections }
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const pageType = searchParams.get('page');
    const lang = searchParams.get('lang') || 'en';

    if (!pageType) {
      return NextResponse.json({ error: 'pageType is required' }, { status: 400 });
    }

    const content = await WebsitePageContent.findOne({ pageType }).lean();
    
    if (!content) {
      // Return seed data if not in DB yet
      const seed = (WEBSITE_PAGE_CONTENT_SEED as any)[pageType];
      if (!seed) return NextResponse.json({ error: 'Invalid page type' }, { status: 404 });
      return NextResponse.json({ pageType, lang, sections: seed });
    }

    const sections = (content.translations as any)?.[lang] || content.sections || (WEBSITE_PAGE_CONTENT_SEED as any)[pageType];

    return NextResponse.json({
      pageType,
      lang,
      sections
    });
  } catch (error) {
    console.error('Admin page-content get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body: any = await req.json();
    const { pageType, lang, sections } = body;

    if (!pageType || !lang || !sections) {
      return NextResponse.json({ error: 'pageType, lang, and sections are required' }, { status: 400 });
    }

    const update: any = {
      $set: {
        [`translations.${lang}`]: sections
      }
    };

    // If updating English, also sync the main 'sections' field for backward compatibility
    if (lang === 'en') {
      update.$set.sections = sections;
    }

    const content = await WebsitePageContent.findOneAndUpdate(
      { pageType },
      update,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Updated successfully',
      pageType,
      lang,
      content
    });
  } catch (error) {
    console.error('Admin page-content update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
