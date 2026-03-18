import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { JobPosition } from '@/lib/models/JobPosition';

const SEED_POSITIONS = [
  { title: 'Senior Full-Stack Engineer', team: 'Engineering', type: 'Full-time', location: 'Remote / Bangalore', description: 'Build scalable education tech. React, Node.js, AI integration.' },
  { title: 'Product Designer', team: 'Design', type: 'Full-time', location: 'Remote / Mumbai', description: 'Create delightful learning experiences for kids and parents.' },
  { title: 'Content & Curriculum Specialist', team: 'Education', type: 'Full-time', location: 'Remote', description: 'Design engaging content across boards and subjects.' },
  { title: 'Customer Success Manager', team: 'Operations', type: 'Full-time', location: 'Remote', description: 'Support parents and teachers, ensure great outcomes.' },
];

export async function POST() {
  try {
    await connectDB();
    for (const p of SEED_POSITIONS) {
      await JobPosition.findOneAndUpdate(
        { title: p.title },
        { $setOnInsert: { ...p, status: 'open' } },
        { upsert: true }
      );
    }
    return NextResponse.json({
      message: 'Job positions seeded successfully',
      count: SEED_POSITIONS.length,
    });
  } catch (error) {
    console.error('Seed job positions error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
