import { NextRequest, NextResponse } from '@/lib/next-compat';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv } from '@/lib/csvExport';

/** Returns CSV template for staff bulk import. */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headerRow = ['name', 'email', 'phone', 'staffRole', 'position', 'department', 'password'];
    const exampleRow = ['John Doe', 'john@example.com', '+919876543210', 'sales', 'Welcome123'];
    const csv = toCsv([headerRow, exampleRow]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="staff-import-template.csv"',
      },
    });
  } catch (error) {
    console.error('Staff template error:', error);
    return NextResponse.json({ error: 'Failed to get template' }, { status: 500 });
  }
}
