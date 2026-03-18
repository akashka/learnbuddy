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

    await connectDB();
    const doc = await WebsiteSettings.findOne().lean();
    const settings = doc
      ? {
          playStoreUrl: doc.playStoreUrl || '',
          appStoreUrl: doc.appStoreUrl || '',
          facebookUrl: doc.facebookUrl || '',
          twitterUrl: doc.twitterUrl || '',
          linkedinUrl: doc.linkedinUrl || '',
          instagramUrl: doc.instagramUrl || '',
          youtubeUrl: doc.youtubeUrl || '',
          contactPhone: doc.contactPhone || '',
          contactHours: doc.contactHours || '',
          contactDays: doc.contactDays || '',
        }
      : {
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
        };
    return NextResponse.json(settings);
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

    const body = (await request.json()) as any;
    const updates: Record<string, string> = {};
    const keys = [
      'playStoreUrl',
      'appStoreUrl',
      'facebookUrl',
      'twitterUrl',
      'linkedinUrl',
      'instagramUrl',
      'youtubeUrl',
    ];
    for (const k of keys) {
      if (typeof body[k] === 'string') {
        updates[k] = body[k].trim();
      }
    }

    await connectDB();
    const doc = await WebsiteSettings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      playStoreUrl: doc?.playStoreUrl || '',
      appStoreUrl: doc?.appStoreUrl || '',
      facebookUrl: doc?.facebookUrl || '',
      twitterUrl: doc?.twitterUrl || '',
      linkedinUrl: doc?.linkedinUrl || '',
      instagramUrl: doc?.instagramUrl || '',
      youtubeUrl: doc?.youtubeUrl || '',
      contactPhone: doc?.contactPhone || '',
      contactHours: doc?.contactHours || '',
      contactDays: doc?.contactDays || '',
    });
  } catch (error) {
    console.error('Admin website settings update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
