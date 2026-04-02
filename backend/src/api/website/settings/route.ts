import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsiteSettings } from '@/lib/models/WebsiteSettings';
import { cacheGetOrSet, CacheKeys, CacheTTL } from '@/lib/cache';

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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    const settings = await cacheGetOrSet(CacheKeys.websiteSettings(lang), CacheTTL.websiteSettings, async () => {
      await connectDB();
      const doc = await WebsiteSettings.findOne().lean();
      if (!doc) return DEFAULTS;

      let contactHours = doc.contactHours || DEFAULTS.contactHours;
      let contactDays = doc.contactDays || DEFAULTS.contactDays;

      if (lang !== 'en' && doc.translations && (doc.translations as any)[lang]) {
        const trans = (doc.translations as any)[lang];
        if (trans.contactHours) contactHours = trans.contactHours;
        if (trans.contactDays) contactDays = trans.contactDays;
      }

      return {
        playStoreUrl: doc.playStoreUrl || DEFAULTS.playStoreUrl,
        appStoreUrl: doc.appStoreUrl || DEFAULTS.appStoreUrl,
        facebookUrl: doc.facebookUrl || '',
        twitterUrl: doc.twitterUrl || '',
        linkedinUrl: doc.linkedinUrl || '',
        instagramUrl: doc.instagramUrl || '',
        youtubeUrl: doc.youtubeUrl || '',
        contactPhone: doc.contactPhone || DEFAULTS.contactPhone,
        contactHours,
        contactDays,
      };
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Website settings fetch error:', error);
    return NextResponse.json(DEFAULTS);
  }
}
