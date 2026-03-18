import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Master } from '@/lib/models/Master';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheGetOrSet, cacheInvalidatePattern, CacheKeys, CacheTTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;

    const masters = await cacheGetOrSet(CacheKeys.masters(type), CacheTTL.masters, async () => {
      await connectDB();
      const query = type ? { type, isActive: true } : { isActive: true };
      return Master.find(query).sort({ displayOrder: 1, value: 1 }).lean();
    });

    return NextResponse.json(masters);
  } catch (error) {
    console.error('Masters fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch masters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const master = await Master.create(body);
    await cacheInvalidatePattern('masters:*');
    return NextResponse.json(master);
  } catch (error) {
    console.error('Master create error:', error);
    return NextResponse.json({ error: 'Failed to create master' }, { status: 500 });
  }
}
