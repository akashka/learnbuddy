import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DiscountCode } from '@/lib/models/DiscountCode';
import { DISCOUNT_CODE_SEED } from '@/lib/discount-code-seed';

export async function POST() {
  try {
    await connectDB();
    let created = 0;
    for (const item of DISCOUNT_CODE_SEED) {
      const existing = await DiscountCode.findOne({ code: item.code });
      if (!existing) {
        await DiscountCode.create(item);
        created++;
      }
    }
    return NextResponse.json({
      message: 'Discount codes seeded successfully',
      count: created,
      total: DISCOUNT_CODE_SEED.length,
    });
  } catch (error) {
    console.error('Seed discount codes error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
