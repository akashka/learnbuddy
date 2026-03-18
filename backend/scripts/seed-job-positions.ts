#!/usr/bin/env tsx
/**
 * Seed job positions and dummy applicants into MongoDB.
 * Run: npm run seed-job-positions
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { JobPosition } from '../src/lib/models/JobPosition';
import { JobApplication } from '../src/lib/models/JobApplication';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

const SEED_POSITIONS = [
  { title: 'Senior Full-Stack Engineer', team: 'Engineering', type: 'Full-time', location: 'Remote / Bangalore', description: 'Build scalable education tech. React, Node.js, AI integration.' },
  { title: 'Product Designer', team: 'Design', type: 'Full-time', location: 'Remote / Mumbai', description: 'Create delightful learning experiences for kids and parents.' },
  { title: 'Content & Curriculum Specialist', team: 'Education', type: 'Full-time', location: 'Remote', description: 'Design engaging content across boards and subjects.' },
  { title: 'Customer Success Manager', team: 'Operations', type: 'Full-time', location: 'Remote', description: 'Support parents and teachers, ensure great outcomes.' },
];

const DUMMY_APPLICANTS = [
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 43210', coverLetter: 'Excited about building education technology. 5+ years React/Node experience.', status: 'new' as const },
  { name: 'Rahul Verma', email: 'rahul.verma@example.com', phone: '+91 91234 56789', coverLetter: 'Passionate about EdTech. Led teams at two startups.', status: 'viewed' as const },
  { name: 'Anita Desai', email: 'anita.desai@example.com', phone: '+91 99887 66554', coverLetter: 'Strong full-stack background. Love working on products that matter.', status: 'in_process' as const },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+91 98765 12345', coverLetter: '10 years in software. Looking for meaningful work in education.', status: 'approved' as const },
  { name: 'Meera Krishnan', email: 'meera.k@example.com', phone: '+91 87654 32109', coverLetter: 'Recently graduated from IIT. Eager to learn and contribute.', status: 'rejected' as const },
  { name: 'Arjun Patel', email: 'arjun.patel@example.com', phone: '+91 76543 21098', coverLetter: 'Product designer with focus on accessibility and UX.', status: 'new' as const },
  { name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91 65432 10987', coverLetter: 'Former teacher turned designer. Understand learner needs deeply.', status: 'viewed' as const },
  { name: 'Karthik Nair', email: 'karthik.nair@example.com', phone: '+91 54321 09876', coverLetter: 'Curriculum designer with 8 years in K-12 content creation.', status: 'in_process' as const },
  { name: 'Divya Menon', email: 'divya.menon@example.com', phone: '+91 43210 98765', coverLetter: 'Content specialist. Worked with NCERT and state boards.', status: 'new' as const },
  { name: 'Rohit Gupta', email: 'rohit.gupta@example.com', phone: '+91 32109 87654', coverLetter: 'Customer success lead. 6 years in EdTech support.', status: 'approved' as const },
  { name: 'Neha Kapoor', email: 'neha.kapoor@example.com', phone: '+91 21098 76543', coverLetter: 'Love helping parents and teachers succeed. CSM certified.', status: 'new' as const },
];

const PLACEHOLDER_RESUME = '/api/uploads/placeholder-resume.pdf';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding job positions...');

  const positionIds: { title: string; id: mongoose.Types.ObjectId }[] = [];

  for (const p of SEED_POSITIONS) {
    const doc = await JobPosition.findOneAndUpdate(
      { title: p.title },
      { $setOnInsert: { ...p, status: 'open' } },
      { upsert: true, new: true }
    );
    if (doc) positionIds.push({ title: p.title, id: doc._id });
    console.log(`  ✓ ${p.title}`);
  }

  console.log('Seeding applicants...');
  let appsCreated = 0;
  for (let i = 0; i < positionIds.length; i++) {
    const pos = positionIds[i];
    const start = i * 2;
    const end = Math.min(start + 3, DUMMY_APPLICANTS.length);
    for (let j = start; j < end; j++) {
      const a = DUMMY_APPLICANTS[j];
      const existing = await JobApplication.findOne({ positionId: pos.id, email: a.email });
      if (!existing) {
        await JobApplication.create({
          positionId: pos.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          resumeUrl: PLACEHOLDER_RESUME,
          coverLetter: a.coverLetter,
          status: a.status,
          remarks: a.status === 'rejected' ? 'Profile not aligned with current needs.' : '',
        });
        appsCreated++;
        console.log(`  ✓ ${a.name} → ${pos.title}`);
      }
    }
  }

  console.log(`Seeded ${SEED_POSITIONS.length} job positions and ${appsCreated} applicants.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
