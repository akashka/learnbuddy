import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { WebsiteSettings } from '@/lib/models/WebsiteSettings';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Get website settings */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');

    await connectDB();
    const doc = await WebsiteSettings.findOne().lean();
    if (!doc) {
      return NextResponse.json({
        playStoreUrl: '',
        appStoreUrl: '',
        facebookUrl: '',
        twitterUrl: '',
        linkedinUrl: '',
        instagramUrl: '',
        youtubeUrl: '',
        contactPhone: '',
        contactHours: '',
        contactDays: '',
      });
    }

    if (lang && lang !== 'en') {
      const trans = (doc.translations as any)?.[lang] || { contactHours: '', contactDays: '' };
      return NextResponse.json({
        ...doc,
        contactHours: trans.contactHours || '',
        contactDays: trans.contactDays || '',
        isTranslation: true,
      });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Admin website settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Update website settings */
export async function PUT(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');

    const body = (await request.json()) as any;
    
    await connectDB();

    if (lang && lang !== 'en') {
      const doc = await WebsiteSettings.findOne();
      if (!doc) {
        return NextResponse.json({ error: 'Base settings not found' }, { status: 404 });
      }
      if (!doc.translations) doc.translations = {};
      doc.translations[lang] = {
        contactHours: typeof body.contactHours === 'string' ? body.contactHours.trim() : '',
        contactDays: typeof body.contactDays === 'string' ? body.contactDays.trim() : '',
      };
      doc.markModified('translations');
      await doc.save();
      return NextResponse.json(doc);
    }

    const updates: Record<string, string> = {};
    const keys = [
      'playStoreUrl',
      'appStoreUrl',
      'facebookUrl',
      'twitterUrl',
      'linkedinUrl',
      'instagramUrl',
      'youtubeUrl',
      'contactPhone',
      'contactHours',
      'contactDays'
    ];
    for (const k of keys) {
      if (typeof body[k] === 'string') {
        updates[k] = body[k].trim();
      }
    }

    const doc = await WebsiteSettings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Admin website settings update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
