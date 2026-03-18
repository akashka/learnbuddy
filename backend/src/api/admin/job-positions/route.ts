import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobPosition } from '@/lib/models/JobPosition';
import { JobApplication } from '@/lib/models/JobApplication';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: List all job positions with application count */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const positions = await JobPosition.find().sort({ createdAt: -1 }).lean();
    const counts = await JobApplication.aggregate([
      { $group: { _id: '$positionId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

    return NextResponse.json({
      positions: positions.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        team: p.team,
        type: p.type,
        location: p.location,
        description: p.description,
        jdUrl: p.jdUrl || null,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        applicationsCount: countMap[p._id.toString()] ?? 0,
      })),
    });
  } catch (error) {
    console.error('Admin job positions list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Create job position */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, team, type, location, description } = body;

    if (!title?.trim() || !team?.trim() || !type?.trim() || !location?.trim()) {
      return NextResponse.json(
        { error: 'Title, team, type, and location are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const position = await JobPosition.create({
      title: title.trim(),
      team: team.trim(),
      type: type.trim(),
      location: location.trim(),
      description: description?.trim() || '',
      status: 'open',
    });

    return NextResponse.json({
      id: position._id.toString(),
      title: position.title,
      team: position.team,
      type: position.type,
      location: position.location,
      description: position.description,
      jdUrl: position.jdUrl || null,
      status: position.status,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    });
  } catch (error) {
    console.error('Admin job position create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
