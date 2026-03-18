import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ParentRegistration } from '@/lib/models/ParentRegistration';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { phone } = (await request.json()) as any;

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const reg = await ParentRegistration.findOne({ phone: normalizedPhone });

    if (!reg) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      isComplete: reg.isComplete,
      data: reg.data,
      redirect: reg.isComplete ? '/parent/dashboard' : undefined,
    });
  } catch (error) {
    console.error('Check phone error:', error);
    return NextResponse.json({ error: 'Failed to check' }, { status: 500 });
  }
}
