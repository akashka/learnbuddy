#!/usr/bin/env tsx
/**
 * Seed admin staff users (company employees) for each role.
 * Run: npx tsx scripts/seed-staff.ts
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/lib/models/User';
import { AdminStaff } from '../src/lib/models/AdminStaff';
import { hashPassword } from '../src/lib/auth';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

const DEFAULT_PASSWORD = 'Welcome123';

const STAFF_SEED = [
  { email: 'admin@example.com', name: 'Super Admin', staffRole: 'admin' as const, phone: '+91 9876543210', position: 'Chief Executive Officer', department: 'Leadership' },
  { email: 'sales@example.com', name: 'Sales Lead', staffRole: 'sales' as const, phone: '+91 9876543211', position: 'Sales Lead', department: 'Sales' },
  { email: 'marketing@example.com', name: 'Marketing Manager', staffRole: 'marketing' as const, phone: '+91 9876543212', position: 'Marketing Manager', department: 'Marketing' },
  { email: 'hr@example.com', name: 'HR Coordinator', staffRole: 'hr' as const, phone: '+91 9876543213', position: 'HR Coordinator', department: 'Human Resources' },
  { email: 'finance@example.com', name: 'Finance Analyst', staffRole: 'finance' as const, phone: '+91 9876543214', position: 'Finance Analyst', department: 'Finance' },
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding admin staff...');

  const ROLE_POSITION_DEPT: Record<string, { position: string; department: string }> = {
    admin: { position: 'Chief Executive Officer', department: 'Leadership' },
    sales: { position: 'Sales Lead', department: 'Sales' },
    marketing: { position: 'Marketing Manager', department: 'Marketing' },
    hr: { position: 'HR Coordinator', department: 'Human Resources' },
    finance: { position: 'Finance Analyst', department: 'Finance' },
  };

  for (const entry of STAFF_SEED) {
    let user = await User.findOne({ email: entry.email });
    if (!user) {
      const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
      user = await User.create({
        email: entry.email,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      console.log(`  ✓ Created User: ${entry.email}`);
    }

    const existingStaff = await AdminStaff.findOne({ userId: user._id });
    if (!existingStaff) {
      await AdminStaff.create({
        userId: user._id,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        staffRole: entry.staffRole,
        position: 'position' in entry ? entry.position : undefined,
        department: 'department' in entry ? entry.department : undefined,
        isActive: true,
      });
      console.log(`  ✓ Created Staff: ${entry.name} (${entry.staffRole})`);
    } else {
      const update: Record<string, unknown> = { name: entry.name, staffRole: entry.staffRole, phone: entry.phone, isActive: true };
      if ('position' in entry) update.position = entry.position;
      if ('department' in entry) update.department = entry.department;
      await AdminStaff.findByIdAndUpdate(existingStaff._id, { $set: update });
      console.log(`  ✓ Updated Staff: ${entry.name} (${entry.staffRole})`);
    }
  }

  // Backfill position & department for any existing staff missing them
  const staffWithoutPosition = await AdminStaff.find({
    $or: [
      { position: { $in: [null, ''] } },
      { position: { $exists: false } },
      { department: { $in: [null, ''] } },
      { department: { $exists: false } },
    ],
  });
  for (const s of staffWithoutPosition) {
    const fallback = ROLE_POSITION_DEPT[s.staffRole] || { position: 'Team Member', department: 'Operations' };
    await AdminStaff.findByIdAndUpdate(s._id, {
      $set: {
        position: s.position || fallback.position,
        department: s.department || fallback.department,
      },
    });
    console.log(`  ✓ Backfilled ${s.name} (${s.email}): ${fallback.position}, ${fallback.department}`);
  }

  console.log(`Seeded ${STAFF_SEED.length} staff users. Backfilled ${staffWithoutPosition.length} with position/department. Default password: ${DEFAULT_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
