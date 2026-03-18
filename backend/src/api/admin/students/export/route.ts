import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: '_id', label: 'ID' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'parentName', label: 'Parent' },
  { key: 'board', label: 'Board' },
  { key: 'classLevel', label: 'Class' },
  { key: 'schoolName', label: 'School' },
  { key: 'createdAt', label: 'Created' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'name,studentId,email,parentName,board,classLevel';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
    const search = searchParams.get('search');
    const board = searchParams.get('board');
    const classLevel = searchParams.get('class');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (board) query.board = board;
    if (classLevel) query.classLevel = classLevel;

    let students = await Student.find(query)
      .populate('userId', 'email')
      .populate('parentId', 'name')
      .limit(10000)
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(searchLower) ||
          (s.studentId || '').toLowerCase().includes(searchLower) ||
          ((s.parentId as { name?: string })?.name || '').toLowerCase().includes(searchLower) ||
          ((s.userId as { email?: string })?.email || '').toLowerCase().includes(searchLower)
      );
    }

    const rows = students.map((s) => {
      const flat = {
        ...s,
        email: (s.userId as { email?: string })?.email ?? '',
        parentName: (s.parentId as { name?: string })?.name ?? '',
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['name', 'studentId', 'email', 'parentName', 'board', 'classLevel'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="students-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Students export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
