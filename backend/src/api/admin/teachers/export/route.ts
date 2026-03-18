import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher, Enrollment } from '@/lib/models';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: '_id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' },
  { key: 'board', label: 'Board' },
  { key: 'bgvVerified', label: 'BGV Verified' },
  { key: 'batchCount', label: 'Batches' },
  { key: 'totalStudents', label: 'Students' },
  { key: 'createdAt', label: 'Created' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'name,email,phone,status,board';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const board = searchParams.get('board');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (board) query.board = board;

    let teachers = await Teacher.find(query)
      .populate('userId', 'email')
      .limit(10000)
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      teachers = teachers.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(searchLower) ||
          (t.phone || '').includes(search) ||
          ((t.userId as { email?: string })?.email || '').toLowerCase().includes(searchLower)
      );
    }

    const teacherIds = teachers.map((t) => (t as { _id: unknown })._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { teacherId: { $in: teacherIds } } },
      { $group: { _id: '$teacherId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(enrollmentCounts.map((e) => [String(e._id), e.count]));

    const rows = teachers.map((t) => {
      const tid = String((t as { _id: unknown })._id);
      const batches = (t as { batches?: unknown[] }).batches || [];
      const flat = {
        ...t,
        email: (t.userId as { email?: string })?.email ?? '',
        batchCount: batches.length,
        totalStudents: countMap[tid] || 0,
        bgvVerified: (t as { bgvVerified?: boolean }).bgvVerified ?? false,
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['name', 'email', 'phone', 'status', 'board'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="teachers-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Teachers export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
