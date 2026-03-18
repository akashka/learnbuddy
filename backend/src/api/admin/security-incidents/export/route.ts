import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { SecurityIncident } from '@/lib/models/SecurityIncident';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: '_id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'childrenDataAffected', label: 'Children Affected' },
  { key: 'detectedAt', label: 'Detected' },
  { key: 'boardNotifiedAt', label: 'Board Notified' },
  { key: 'usersNotifiedAt', label: 'Users Notified' },
  { key: 'affectedUserCount', label: 'Users Affected' },
  { key: 'createdAt', label: 'Created' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'title,type,severity,status,childrenDataAffected,detectedAt';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const incidents = await SecurityIncident.find(query)
      .sort({ detectedAt: -1 })
      .limit(10000)
      .lean();

    const rows = incidents.map((p) => {
      const flat = {
        ...p,
        childrenDataAffected: (p as { childrenDataAffected?: boolean }).childrenDataAffected ? 'Yes' : 'No',
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['title', 'type', 'severity', 'status', 'detectedAt'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="security-incidents-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Security incidents export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
