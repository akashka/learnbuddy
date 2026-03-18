import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: '_id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'childrenCount', label: 'Children' },
  { key: 'createdAt', label: 'Created' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'name,email,phone,location,childrenCount';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
    const search = searchParams.get('search');

    await connectDB();

    let parents = await Parent.find({})
      .populate('userId', 'email')
      .limit(10000)
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      parents = parents.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(searchLower) ||
          (p.phone || '').includes(search) ||
          ((p.userId as { email?: string })?.email || '').toLowerCase().includes(searchLower)
      );
    }

    const rows = parents.map((p) => {
      const children = (p as { children?: unknown[] }).children || [];
      const flat = {
        ...p,
        email: (p.userId as { email?: string })?.email ?? '',
        childrenCount: Array.isArray(children) ? children.length : 0,
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['name', 'email', 'phone', 'childrenCount'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="parents-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Parents export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
