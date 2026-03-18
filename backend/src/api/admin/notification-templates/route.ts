import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { NotificationTemplate } from '@/lib/models/NotificationTemplate';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: List notification templates, optionally filtered by channel */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') as 'sms' | 'email' | 'in_app' | null;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query: Record<string, unknown> = {};
    if (channel) query.channel = channel;
    if (!includeInactive) query.isActive = true;

    const templates = await NotificationTemplate.find(query)
      .sort({ channel: 1, code: 1 })
      .lean();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Admin notification templates fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Create notification template */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const data = (await request.json()) as Record<string, unknown>;
    const {
      channel,
      code,
      name,
      description,
      isActive,
      body,
      approvedWordings,
      subject,
      bodyHtml,
      headerHtml,
      footerHtml,
      logoUrl,
      title,
      message,
      ctaLabel,
      ctaUrl,
      variableHints,
    } = data;

    if (!channel || !code || !name) {
      return NextResponse.json({ error: 'channel, code, and name are required' }, { status: 400 });
    }

    if (!['sms', 'email', 'in_app'].includes(channel as string)) {
      return NextResponse.json({ error: 'channel must be sms, email, or in_app' }, { status: 400 });
    }

    const existing = await NotificationTemplate.findOne({ channel, code });
    if (existing) {
      return NextResponse.json({ error: 'Template with this channel and code already exists' }, { status: 400 });
    }

    const doc: Record<string, unknown> = {
      channel,
      code: String(code).trim(),
      name: String(name).trim(),
      description: description ? String(description).trim() : undefined,
      isActive: isActive !== false,
    };

    if (channel === 'sms') {
      doc.body = body ? String(body).trim() : '';
      doc.approvedWordings = Array.isArray(approvedWordings) ? approvedWordings.map(String) : [];
    } else if (channel === 'email') {
      doc.subject = subject ? String(subject).trim() : '';
      doc.bodyHtml = bodyHtml ? String(bodyHtml) : '';
      doc.headerHtml = headerHtml ? String(headerHtml) : undefined;
      doc.footerHtml = footerHtml ? String(footerHtml) : undefined;
      doc.logoUrl = logoUrl ? String(logoUrl).trim() : undefined;
    } else if (channel === 'in_app') {
      doc.title = title ? String(title).trim() : '';
      doc.message = message ? String(message).trim() : '';
      doc.ctaLabel = ctaLabel ? String(ctaLabel).trim() : undefined;
      doc.ctaUrl = ctaUrl ? String(ctaUrl).trim() : undefined;
    }

    if (Array.isArray(variableHints)) doc.variableHints = variableHints.map(String);

    const created = await NotificationTemplate.create(doc);
    return NextResponse.json(created);
  } catch (error) {
    console.error('Admin notification template create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
