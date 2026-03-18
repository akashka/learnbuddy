import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DiscountCode } from '@/lib/models/DiscountCode';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const doc = await DiscountCode.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ code: doc });
  } catch (error) {
    console.error('Discount code get error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = (await request.json()) as any;
    const {
      code,
      type,
      value,
      minAmount,
      maxDiscountAmount,
      maxUses,
      validFrom,
      validUntil,
      isActive,
      applicableBoards,
      applicableClasses,
      description,
    } = body;

    const doc = await DiscountCode.findById(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (code != null) doc.code = String(code).trim().toUpperCase();
    if (type != null) {
      if (!['percent', 'fixed'].includes(type)) {
        return NextResponse.json({ error: 'Type must be percent or fixed' }, { status: 400 });
      }
      doc.type = type;
    }
    if (value != null) {
      if (doc.type === 'percent' && (value < 0 || value > 100)) {
        return NextResponse.json({ error: 'Percent value must be 0-100' }, { status: 400 });
      }
      doc.value = Number(value);
    }
    if (minAmount !== undefined) doc.minAmount = minAmount != null ? Number(minAmount) : undefined;
    if (maxDiscountAmount !== undefined) doc.maxDiscountAmount = maxDiscountAmount != null ? Number(maxDiscountAmount) : undefined;
    if (maxUses !== undefined) doc.maxUses = maxUses != null ? Number(maxUses) : undefined;
    if (validFrom != null) doc.validFrom = new Date(validFrom);
    if (validUntil != null) doc.validUntil = new Date(validUntil);
    if (isActive !== undefined) doc.isActive = Boolean(isActive);
    if (applicableBoards !== undefined) doc.applicableBoards = Array.isArray(applicableBoards) ? applicableBoards : [];
    if (applicableClasses !== undefined) doc.applicableClasses = Array.isArray(applicableClasses) ? applicableClasses : [];
    if (description !== undefined) doc.description = description || undefined;

    await doc.save();

    return NextResponse.json({ code: doc });
  } catch (error) {
    console.error('Discount code update error:', error);
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'A discount code with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
