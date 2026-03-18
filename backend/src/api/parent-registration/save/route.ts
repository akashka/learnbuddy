import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { ParentRegistration } from '@/lib/models/ParentRegistration';
import { User } from '@/lib/models/User';
import { Parent } from '@/lib/models/Parent';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, data: formData, complete } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);

    if (formData?.email) {
      const existingUser = await User.findOne({ email: formData.email });
      const reg = await ParentRegistration.findOne({ phone: normalizedPhone });
      if (existingUser && existingUser._id.toString() !== reg?.userId?.toString()) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
    }

    let reg = await ParentRegistration.findOne({ phone: normalizedPhone });

    if (!reg) {
      if (formData?.email && formData?.name && complete) {
        const hashedPassword = await hashPassword(randomUUID() + Date.now());
        const user = await User.create({
          email: formData.email,
          password: hashedPassword,
          phone: normalizedPhone,
          role: 'parent',
        });
        const parent = await Parent.create({
          userId: user._id,
          name: formData.name,
          phone: normalizedPhone,
          location: formData.location,
          children: [],
        });
        reg = await ParentRegistration.create({
          phone: normalizedPhone,
          data: { ...formData, password: undefined },
          isComplete: true,
          userId: user._id,
          parentId: parent._id,
          lastSavedAt: new Date(),
        });
        const token = generateToken(user._id.toString(), 'parent');
        return NextResponse.json({
          success: true,
          isComplete: true,
          registrationId: reg._id,
          token,
          user: { id: String(user._id), email: formData.email, role: 'parent' },
          parentName: formData.name,
        });
      } else {
        reg = await ParentRegistration.create({
          phone: normalizedPhone,
          data: formData ? { ...formData, password: undefined } : undefined,
          isComplete: false,
          lastSavedAt: new Date(),
        });
      }
    } else {
      const update: Record<string, unknown> = {
        lastSavedAt: new Date(),
        data: formData ? { ...reg.data, ...formData, password: undefined } : reg.data,
      };

      if (complete && formData?.email && formData?.name) {
        if (!reg.userId) {
          const hashedPassword = await hashPassword(randomUUID() + Date.now());
          const user = await User.create({
            email: formData.email,
            password: hashedPassword,
            phone: normalizedPhone,
            role: 'parent',
          });
          const parent = await Parent.create({
            userId: user._id,
            name: formData.name,
            phone: normalizedPhone,
            location: formData.location,
            children: [],
          });
          update.userId = user._id;
          update.parentId = parent._id;
        } else {
          await Parent.findByIdAndUpdate(reg.parentId, {
            name: formData.name,
            location: formData.location,
          });
        }
        update.isComplete = true;
      }

      await ParentRegistration.findByIdAndUpdate(reg._id, update);
      reg = await ParentRegistration.findById(reg._id);

      if (complete && formData?.email && formData?.name && reg?.userId) {
        const token = generateToken(reg.userId.toString(), 'parent');
        const userDoc = await User.findById(reg.userId).lean();
        return NextResponse.json({
          success: true,
          isComplete: true,
          registrationId: reg._id,
          token,
          user: { id: String(reg.userId), email: userDoc?.email || formData.email, role: 'parent' },
          parentName: formData.name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      isComplete: reg?.isComplete,
      registrationId: reg?._id,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
