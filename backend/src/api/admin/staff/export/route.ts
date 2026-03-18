import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: '_id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'staffRole', label: 'Role' },
  { key: 'position', label: 'Position' },
  { key: 'department', label: 'Department' },
  { key: 'isActive', label: 'Active' },
  { key: 'createdAt', label: 'Created' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'name,email,phone,staffRole,isActive';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);

    await connectDB();

    const staff = await AdminStaff.find({})
      .populate('userId', 'email isActive')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const rows = staff.map((s) => {
      const flat = {
        ...s,
        isActive: (s.userId as { isActive?: boolean })?.isActive ?? s.isActive ?? true,
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['name', 'email', 'phone', 'staffRole', 'position', 'department', 'isActive'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="staff-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Staff export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
