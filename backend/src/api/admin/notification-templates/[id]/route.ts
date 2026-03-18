import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { NotificationTemplate } from '@/lib/models/NotificationTemplate';
import { getAuthFromRequest } from '@/lib/auth';

/** Admin: Get single notification template */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const template = await NotificationTemplate.findById(id).lean();
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Admin notification template fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/** Admin: Update notification template */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = (await request.json()) as Record<string, unknown>;
    const {
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

    await connectDB();

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined) updates.description = description ? String(description).trim() : '';
    if (isActive !== undefined) updates.isActive = isActive;

    if (body !== undefined) updates.body = body ? String(body).trim() : '';
    if (approvedWordings !== undefined) updates.approvedWordings = Array.isArray(approvedWordings) ? approvedWordings.map(String) : [];
    if (subject !== undefined) updates.subject = subject ? String(subject).trim() : '';
    if (bodyHtml !== undefined) updates.bodyHtml = bodyHtml ? String(bodyHtml) : '';
    if (headerHtml !== undefined) updates.headerHtml = headerHtml ? String(headerHtml) : '';
    if (footerHtml !== undefined) updates.footerHtml = footerHtml ? String(footerHtml) : '';
    if (logoUrl !== undefined) updates.logoUrl = logoUrl ? String(logoUrl).trim() : '';
    if (title !== undefined) updates.title = title ? String(title).trim() : '';
    if (message !== undefined) updates.message = message ? String(message).trim() : '';
    if (ctaLabel !== undefined) updates.ctaLabel = ctaLabel ? String(ctaLabel).trim() : '';
    if (ctaUrl !== undefined) updates.ctaUrl = ctaUrl ? String(ctaUrl).trim() : '';
    if (variableHints !== undefined) updates.variableHints = Array.isArray(variableHints) ? variableHints.map(String) : [];

    const updated = await NotificationTemplate.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin notification template update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/** Admin: Delete notification template */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const deleted = await NotificationTemplate.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notification template delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
