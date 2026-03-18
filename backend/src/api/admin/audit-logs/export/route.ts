import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: 'createdAt', label: 'Timestamp' },
  { key: 'actorEmail', label: 'Actor' },
  { key: 'actorRole', label: 'Role' },
  { key: 'action', label: 'Action' },
  { key: 'resourceType', label: 'Resource' },
  { key: 'resourceId', label: 'Resource ID' },
  { key: 'method', label: 'Method' },
  { key: 'path', label: 'Path' },
  { key: 'statusCode', label: 'Status' },
  { key: 'success', label: 'Success' },
  { key: 'ipAddress', label: 'IP' },
  { key: 'userAgent', label: 'User Agent' },
  { key: 'requestId', label: 'Request ID' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'createdAt,actorEmail,actorRole,action,resourceType,resourceId,method,path,statusCode,success,ipAddress';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) (query.createdAt as Record<string, Date>).$lte = new Date(to);
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const rows = logs.map((p) => {
      const flat = {
        ...p,
        success: (p as { success?: boolean }).success ? 'Yes' : 'No',
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['createdAt', 'actorEmail', 'action', 'resourceType', 'path', 'statusCode', 'success'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Audit logs export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
