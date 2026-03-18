/**
 * Debug script to verify ClassSession studentIds and student matching.
 * Run: npx tsx scripts/debug-class-sessions.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

async function main() {
  const connectDB = (await import('../src/lib/db')).default;
  await connectDB();
  const { ClassSession } = await import('../src/lib/models/ClassSession');
  const { Student } = await import('../src/lib/models/Student');
  const { Enrollment } = await import('../src/lib/models/Enrollment');

  const sessions = await ClassSession.find({ status: 'scheduled' }).limit(5).lean();

  console.log('\n=== ClassSessions (scheduled) ===');
  for (const s of sessions) {
    const raw = s as { studentIds?: unknown[]; teacherId?: unknown };
    console.log({
      _id: s._id,
      teacherId: raw.teacherId,
      subject: s.subject,
      batchId: s.batchId,
      studentIds: raw.studentIds,
      studentIdsCount: raw.studentIds?.length ?? 0,
      scheduledAt: s.scheduledAt,
    });
  }

  const students = await Student.find({}).select('_id name studentId userId').limit(5).lean();
  console.log('\n=== Students ===');
  for (const st of students) {
    console.log({ _id: st._id, name: st.name, studentId: st.studentId });
  }

  const enrollments = await Enrollment.find({ status: 'active' }).limit(3).lean();
  console.log('\n=== Enrollments (sample) ===');
  for (const e of enrollments) {
    console.log({ _id: e._id, studentId: e.studentId, teacherId: e.teacherId, subject: e.subject });
  }

  if (students.length > 0 && sessions.length > 0) {
    const testStudentId = students[0]._id;
    const match1 = await ClassSession.findOne({
      status: 'scheduled',
      studentIds: testStudentId,
    }).lean();
    const match2 = await ClassSession.findOne({
      status: 'scheduled',
      studentIds: { $in: [testStudentId] },
    }).lean();
    console.log('\n=== Query test (student', String(testStudentId), ') ===');
    console.log('Query { studentIds: studentId }:', match1 ? match1._id : 'NONE');
    console.log('Query { studentIds: { $in: [studentId] } }:', match2 ? match2._id : 'NONE');
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
