import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsiteSettings } from '@/lib/models/WebsiteSettings';

const SEED_DATA = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.learnbuddy.app',
  appStoreUrl: 'https://apps.apple.com/app/learnbuddy/id1234567890',
  facebookUrl: 'https://facebook.com/learnbuddy',
  twitterUrl: 'https://x.com/learnbuddy',
  linkedinUrl: 'https://linkedin.com/company/learnbuddy',
  instagramUrl: 'https://instagram.com/learnbuddy',
  youtubeUrl: 'https://youtube.com/@learnbuddy',
};

export async function POST() {
  try {
    await connectDB();
    await WebsiteSettings.findOneAndUpdate({}, { $set: SEED_DATA }, { upsert: true });
    return NextResponse.json({
      message: 'Website settings seeded successfully',
      settings: SEED_DATA,
    });
  } catch (error) {
    console.error('Seed website settings error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
