import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { validateDiscountCode } from '@/lib/discount-utils';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { code, amountBeforeCode, board, classLevel } = body;

    if (!code || amountBeforeCode == null) {
      return NextResponse.json({ error: 'Code and amount are required' }, { status: 400 });
    }

    const result = await validateDiscountCode({
      code: String(code),
      amountBeforeCode: Number(amountBeforeCode),
      board: board || '',
      classLevel: classLevel || '',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Discount validate error:', error);
    return NextResponse.json({ error: 'Failed to validate', valid: false }, { status: 500 });
  }
}
