import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { CmsPage } from '@/lib/models/CmsPage';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content' },
  { key: 'updatedAt', label: 'Updated' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'slug,title,updatedAt';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);

    await connectDB();

    const pages = await CmsPage.find().sort({ slug: 1 }).lean();
    const rows = pages.map((p) => pickFields(p as Record<string, unknown>, fields));

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['slug', 'title', 'updatedAt'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cms-pages-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('CMS pages export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
