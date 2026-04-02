import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsitePageContent } from '@/lib/models';
import { WEBSITE_PAGE_CONTENT_SEED } from '@/lib/website-page-content-seed';
import { LOCALES, getCmsSeedDataForLocale } from '@/lib/cms-i18n-seed-data';

export async function POST() {
  try {
    await connectDB();

    // Prepare translation map for each page type
    const pageTypes = Object.keys(WEBSITE_PAGE_CONTENT_SEED);
    
    for (const pageType of pageTypes) {
      const translations: Record<string, any> = {};
      
      for (const locale of LOCALES) {
        const localeData = getCmsSeedDataForLocale(locale);
        translations[locale] = localeData[pageType] || WEBSITE_PAGE_CONTENT_SEED[pageType];
      }

      await WebsitePageContent.findOneAndUpdate(
        { pageType },
        { 
          $set: { 
            sections: WEBSITE_PAGE_CONTENT_SEED[pageType], // Backward compatibility
            translations 
          } 
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      message: 'Website page content seeded successfully with all languages',
      pageTypes,
      locales: LOCALES,
    });
  } catch (error) {
    console.error('Seed website page content error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
