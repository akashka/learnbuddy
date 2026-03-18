import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherReview } from '@/lib/models/TeacherReview';
import { cacheGetOrSet, CacheKeys, CacheTTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = new URLSearchParams(searchParams).toString();
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');
    const subject = searchParams.get('subject');
    const day = searchParams.get('day');
    const minFee = searchParams.get('minFee');
    const maxFee = searchParams.get('maxFee');
    const timeSlot = searchParams.get('time');
    const search = searchParams.get('search')?.trim();
    const sort = searchParams.get('sort') || 'relevance';
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((id) => id.trim()).filter(Boolean) : null;

    const result = await cacheGetOrSet(
      CacheKeys.marketplace(queryString || 'empty'),
      CacheTTL.marketplace,
      async () => {
        await connectDB();

        const query: Record<string, unknown> = { status: 'qualified' };
        if (ids?.length) query['_id'] = { $in: ids };
        if (board) query['board'] = board;
        if (classLevel) query['classes'] = classLevel;
        if (subject) query['subjects'] = subject;

        let teachers = await Teacher.find(query)
          .select('-phone -__v')
          .lean();

        if (search) {
          const searchLower = search.toLowerCase();
          teachers = teachers.filter((t) =>
            (t.name || '').toLowerCase().includes(searchLower)
          );
        }

        if (day) {
          teachers = teachers.filter((t) =>
            (t.batches || []).some((b: { slots?: { day: string }[] }) =>
              (b.slots || []).some((s) => s.day?.toLowerCase() === day.toLowerCase())
            )
          );
        }
        if (minFee) {
          teachers = teachers.filter((t) =>
            (t.batches || []).some((b: { feePerMonth?: number }) => (b.feePerMonth || 0) >= parseInt(minFee))
          );
        }
        if (maxFee) {
          teachers = teachers.filter((t) =>
            (t.batches || []).some((b: { feePerMonth?: number }) => (b.feePerMonth || 0) <= parseInt(maxFee))
          );
        }
        if (timeSlot) {
          teachers = teachers.filter((t) =>
            (t.batches || []).some((b: { slots?: { startTime?: string; endTime?: string }[] }) =>
              (b.slots || []).some((s) => {
                const start = s.startTime || '00:00';
                const end = s.endTime || '23:59';
                return timeSlot >= start && timeSlot <= end;
              })
            )
          );
        }

        const teacherIds = teachers.map((t) => t._id);
        const reviews = await TeacherReview.aggregate([
          { $match: { teacherId: { $in: teacherIds } } },
          { $group: { _id: '$teacherId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        const reviewMap = Object.fromEntries(reviews.map((r) => [r._id.toString(), r]));

        let out = teachers.map((t) => {
          const r = reviewMap[t._id.toString()];
          const batches = (t.batches || []).filter((b: { isActive?: boolean }) => b.isActive !== false);
          const minFeeVal = batches.length ? Math.min(...batches.map((b: { feePerMonth?: number }) => b.feePerMonth || 0)) : 0;
          return {
            ...t,
            averageRating: r?.avgRating ? Math.round(r.avgRating * 10) / 10 : null,
            reviewCount: r?.count || 0,
            feeStartsFrom: minFeeVal,
          };
        });

        const sortFn = (a: { marketplaceOrder?: number; feeStartsFrom?: number; averageRating?: number | null }, b: typeof a) => {
          switch (sort) {
            case 'relevance':
              return (a.marketplaceOrder ?? 999) - (b.marketplaceOrder ?? 999);
            case 'cost_asc':
              return (a.feeStartsFrom ?? 0) - (b.feeStartsFrom ?? 0);
            case 'cost_desc':
              return (b.feeStartsFrom ?? 0) - (a.feeStartsFrom ?? 0);
            case 'ratings':
              return (b.averageRating ?? 0) - (a.averageRating ?? 0);
            default:
              return (a.marketplaceOrder ?? 999) - (b.marketplaceOrder ?? 999);
          }
        };
        return out.sort(sortFn);
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Marketplace error:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}
