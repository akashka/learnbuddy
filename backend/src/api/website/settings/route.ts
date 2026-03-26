import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsiteSettings } from '@/lib/models/WebsiteSettings';

const DEFAULTS = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.guruchakra.app',
  appStoreUrl: 'https://apps.apple.com/app/guruchakra/id000000000',
  facebookUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  contactPhone: '+91 1800-123-4567',
  contactHours: '9 AM – 6 PM',
  contactDays: 'Mon – Sat',
};

/** Public: Get website settings (app store links, social URLs). No auth required. */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const doc = await WebsiteSettings.findOne().lean();
    const settings = doc
      ? {
          playStoreUrl: doc.playStoreUrl || DEFAULTS.playStoreUrl,
          appStoreUrl: doc.appStoreUrl || DEFAULTS.appStoreUrl,
          facebookUrl: doc.facebookUrl || '',
          twitterUrl: doc.twitterUrl || '',
          linkedinUrl: doc.linkedinUrl || '',
          instagramUrl: doc.instagramUrl || '',
          youtubeUrl: doc.youtubeUrl || '',
          contactPhone: doc.contactPhone || DEFAULTS.contactPhone,
          contactHours: doc.contactHours || DEFAULTS.contactHours,
          contactDays: doc.contactDays || DEFAULTS.contactDays,
        }
      : DEFAULTS;
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Website settings fetch error:', error);
    return NextResponse.json(DEFAULTS);
  }
}
