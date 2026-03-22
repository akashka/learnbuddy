import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { TeacherReview } from '@/lib/models/TeacherReview';
import { cacheGetOrSet, CacheKeys, CacheTTL } from '@/lib/cache';

function parseArrayParam(param: string | null): string[] {
  if (!param) return [];
  return param.split(',').map((s) => s.trim()).filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = new URLSearchParams(searchParams).toString();
    const boards = parseArrayParam(searchParams.get('board'));
    const classes = parseArrayParam(searchParams.get('class'));
    const subjects = parseArrayParam(searchParams.get('subject'));
    const days = parseArrayParam(searchParams.get('day'));
    const times = parseArrayParam(searchParams.get('time'));
    const minFee = searchParams.get('minFee');
    const maxFee = searchParams.get('maxFee');
    const batchStartFrom = searchParams.get('batchStartFrom');
    const bgvVerified = searchParams.get('bgvVerified');
    const minExperience = searchParams.get('minExperience');
    const languages = parseArrayParam(searchParams.get('languages'));
    const search = searchParams.get('search')?.trim();
    const sort = searchParams.get('sort') || 'relevance';
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((id) => id.trim()).filter(Boolean) : null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const cacheKey = new URLSearchParams(searchParams);
    cacheKey.delete('limit');
    cacheKey.delete('offset');
    const cacheKeyStr = cacheKey.toString() || 'empty';

    const fullResult = await cacheGetOrSet(
      CacheKeys.marketplace(cacheKeyStr),
      CacheTTL.marketplace,
      async () => {
        await connectDB();

        const query: Record<string, unknown> = { status: 'qualified' };
        if (ids?.length) query['_id'] = { $in: ids };
        if (boards.length) query['board'] = boards.length === 1 ? boards[0] : { $in: boards };
        if (classes.length) query['classes'] = classes.length === 1 ? classes[0] : { $in: classes };
        if (subjects.length) query['subjects'] = subjects.length === 1 ? subjects[0] : { $in: subjects };
        if (bgvVerified === 'true') query['bgvVerified'] = true;
        if (minExperience) {
          const months = parseInt(minExperience, 10);
          if (!isNaN(months)) query['experienceMonths'] = { $gte: months };
        }
        if (languages.length) {
          query['languages'] = { $in: languages };
        }

        let teachers = await Teacher.find(query)
          .select('-phone -__v')
          .lean();

        if (search) {
          const searchLower = search.toLowerCase();
          teachers = teachers.filter((t) =>
            (t.name || '').toLowerCase().includes(searchLower)
          );
        }

        if (days.length) {
          const daysLower = days.map((d) => d.toLowerCase());
          teachers = teachers.filter((t) =>
            (t.batches || []).some((b: { slots?: { day: string }[] }) =>
              (b.slots || []).some((s) => s.day && daysLower.includes(s.day.toLowerCase()))
            )
          );
        }
        if (times.length) {
          teachers = teachers.filter((t) =>
            (t.batches || []).some((b: { slots?: { startTime?: string; endTime?: string }[] }) =>
              (b.slots || []).some((s) => {
                const start = s.startTime || '00:00';
                const end = s.endTime || '23:59';
                return times.some((time) => time >= start && time <= end);
              })
            )
          );
        }
        if (minFee) {
          const min = parseInt(minFee, 10);
          if (!isNaN(min)) {
            teachers = teachers.filter((t) =>
              (t.batches || []).some((b: { feePerMonth?: number }) => (b.feePerMonth || 0) >= min)
            );
          }
        }
        if (maxFee) {
          const max = parseInt(maxFee, 10);
          if (!isNaN(max)) {
            teachers = teachers.filter((t) =>
              (t.batches || []).some((b: { feePerMonth?: number }) => (b.feePerMonth || 0) <= max)
            );
          }
        }
        if (batchStartFrom) {
          const fromDate = new Date(batchStartFrom);
          if (!isNaN(fromDate.getTime())) {
            teachers = teachers.filter((t) =>
              (t.batches || []).some((b: { startDate?: Date }) =>
                b.startDate && new Date(b.startDate) >= fromDate
              )
            );
          }
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

    const total = fullResult.length;
    const teachers = fullResult.slice(offset, offset + limit);
    return NextResponse.json({ teachers, total });
  } catch (error) {
    console.error('Marketplace error:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}
