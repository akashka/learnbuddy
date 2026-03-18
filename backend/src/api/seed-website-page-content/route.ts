import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsitePageContent } from '@/lib/models';
import { WEBSITE_PAGE_CONTENT_SEED } from '@/lib/website-page-content-seed';

export async function POST() {
  try {
    await connectDB();
    for (const [pageType, sections] of Object.entries(WEBSITE_PAGE_CONTENT_SEED)) {
      await WebsitePageContent.findOneAndUpdate(
        { pageType },
        { $set: { sections } },
        { upsert: true }
      );
    }
    return NextResponse.json({
      message: 'Website page content seeded successfully',
      pageTypes: Object.keys(WEBSITE_PAGE_CONTENT_SEED),
    });
  } catch (error) {
    console.error('Seed website page content error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
