import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DiscountCode } from '@/lib/models/DiscountCode';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const codes = await DiscountCode.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Discount codes list error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (!code || !type || value == null) {
      return NextResponse.json({ error: 'Code, type, and value are required' }, { status: 400 });
    }
    if (!['percent', 'fixed'].includes(type)) {
      return NextResponse.json({ error: 'Type must be percent or fixed' }, { status: 400 });
    }
    if (type === 'percent' && (value < 0 || value > 100)) {
      return NextResponse.json({ error: 'Percent value must be 0-100' }, { status: 400 });
    }
    if (type === 'fixed' && value < 0) {
      return NextResponse.json({ error: 'Fixed value must be >= 0' }, { status: 400 });
    }

    const validFromDate = validFrom ? new Date(validFrom) : new Date();
    const validUntilDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const doc = await DiscountCode.create({
      code: String(code).trim().toUpperCase(),
      type,
      value: Number(value),
      minAmount: minAmount != null ? Number(minAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount != null ? Number(maxDiscountAmount) : undefined,
      maxUses: maxUses != null ? Number(maxUses) : undefined,
      validFrom: validFromDate,
      validUntil: validUntilDate,
      isActive: isActive !== false,
      applicableBoards: Array.isArray(applicableBoards) ? applicableBoards : [],
      applicableClasses: Array.isArray(applicableClasses) ? applicableClasses : [],
      description: description || undefined,
    });

    return NextResponse.json({ code: doc });
  } catch (error) {
    console.error('Discount code create error:', error);
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'A discount code with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
