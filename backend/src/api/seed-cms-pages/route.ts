import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { CmsPage } from '@/lib/models/CmsPage';
import { CMS_SEED_PAGES } from '@/lib/cms-seed-data';

export async function POST() {
  try {
    await connectDB();

    for (const page of CMS_SEED_PAGES) {
      await CmsPage.findOneAndUpdate(
        { slug: page.slug },
        { $setOnInsert: page },
        { upsert: true }
      );
    }

    return NextResponse.json({
      message: 'CMS pages seeded successfully',
      count: CMS_SEED_PAGES.length,
    });
  } catch (error) {
    console.error('Seed CMS pages error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
