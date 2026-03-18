import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobPosition } from '@/lib/models/JobPosition';

/** Public: List open job positions */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const positions = await JobPosition.find({ status: 'open' })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      positions: positions.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        team: p.team,
        type: p.type,
        location: p.location,
        description: p.description,
        jdUrl: p.jdUrl || null,
      })),
    });
  } catch (error) {
    console.error('Job positions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
