import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobPosition } from '@/lib/models/JobPosition';

/** Public: List open job positions */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');

    await connectDB();
    const positions = await JobPosition.find({ status: 'open' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      positions: positions.map((p) => {
        let title = p.title;
        let team = p.team;
        let description = p.description;

        if (lang && p.translations && (p.translations as any)[lang]) {
          const trans = (p.translations as any)[lang];
          if (trans.title) title = trans.title;
          if (trans.team) team = trans.team;
          if (trans.description) description = trans.description;
        }

        return {
          id: (p as any)._id.toString(),
          title,
          team,
          type: p.type,
          location: p.location,
          description,
          jdUrl: p.jdUrl || null,
        };
      }),
    });
  } catch (error) {
    console.error('Job positions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
