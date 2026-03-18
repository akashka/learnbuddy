import mongoose from 'mongoose';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { DeleteAccountRequest } from '@/lib/models/DeleteAccountRequest';
import { executeDeletion } from '@/lib/deleteAccount';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'parent' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { otp } = body;

    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json({ error: 'Valid 6-digit OTP required' }, { status: 400 });
    }

    const req = await DeleteAccountRequest.findOne({
      userId: decoded.userId,
      otp: String(otp).trim(),
    });

    if (!req) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    if (req.expiresAt < new Date()) {
      await DeleteAccountRequest.deleteOne({ _id: req._id });
      return NextResponse.json({ error: 'OTP expired. Please request a new one' }, { status: 400 });
    }

    await executeDeletion(
      decoded.userId,
      req.role,
      req.scope,
      req.studentIds?.map((id: mongoose.Types.ObjectId) => id.toString())
    );
    await DeleteAccountRequest.deleteOne({ _id: req._id });

    return NextResponse.json({
      success: true,
      message: 'Account data deleted successfully',
      deleted: true,
    });
  } catch (error) {
    console.error('Delete confirm error:', error);
    return NextResponse.json({ error: 'Failed to complete deletion' }, { status: 500 });
  }
}
