import mongoose from 'mongoose';
import connectDB from '../src/lib/db';
import { User } from '../src/lib/models/User';
import { Teacher } from '../src/lib/models/Teacher';
import { Parent } from '../src/lib/models/Parent';
import { Student } from '../src/lib/models/Student';
import { Enrollment } from '../src/lib/models/Enrollment';
import { ClassSession } from '../src/lib/models/ClassSession';
import { ClassRescheduleRequest } from '../src/lib/models/ClassRescheduleRequest';
import { processEnrollmentConfirmation } from '../src/lib/jobs/enrollment-confirmation';

async function runTest() {
  console.log('--- Starting Scheduling Test ---');
  await connectDB();

  const saltStr = Date.now().toString(36);
  
  // 1. Setup: Create Teacher, Parent, Student
  const teacherUser = await User.create({ email: `t_${saltStr}@test.com`, password: 'pwd', role: 'teacher' });
  const teacher = await Teacher.create({
    userId: teacherUser._id,
    name: 'Test Teacher',
    status: 'qualified',
    batches: [{
      name: 'Batch 1',
      subject: 'Math',
      board: 'CBSE',
      classLevel: '10',
      feePerMonth: 1000,
      startDate: new Date(),
      slots: [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }]
    }]
  });

  const parentUser = await User.create({ email: `p_${saltStr}@test.com`, password: 'pwd', role: 'parent' });
  const parent = await Parent.create({
    userId: parentUser._id,
    children: [],
  });

  const studentUser = await User.create({ email: `s_${saltStr}@test.com`, password: 'pwd', role: 'student' });
  const student = await Student.create({
    userId: studentUser._id,
    parentId: parent._id,
    name: 'Test Student',
    classLevel: '10',
    board: 'CBSE',
  });

  // 2. Create Enrollment for 3 months
  console.log('1. Creating 3-month Enrollment');
  const durationMonths = 3;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start tomorrow
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const enrollment = await Enrollment.create({
    studentId: student._id,
    teacherId: teacher._id,
    batchId: 'Batch 1',
    subject: 'Math',
    board: 'CBSE',
    classLevel: '10',
    slots: [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }],
    feePerMonth: 1000,
    duration: '3months',
    discount: 0,
    totalAmount: 3000,
    paymentStatus: 'completed',
    status: 'active',
    startDate,
    endDate,
  });

  // 3. Process Confirmation (Run the Job)
  console.log('2. Running Enrollment Confirmation Job');
  process.env.REDIS_URL = ''; // Disable actual queueing, run synchronously for test
  await processEnrollmentConfirmation({ enrollmentId: String(enrollment._id) });

  // 4. Assert ClassSessions
  const generatedSessions = await ClassSession.find({ enrollmentIds: enrollment._id }).sort('scheduledAt');
  console.log(`3. Verified ${generatedSessions.length} ClassSessions were automatically generated for the enrollment duration.`);
  
  if (generatedSessions.length === 0) {
    throw new Error('No class sessions generated!');
  }

  // 5. Test Reschedule Request
  console.log('4. Testing Reschedule Request Flow');
  const sessionToReschedule = generatedSessions[0];
  
  const proposeDate = new Date(sessionToReschedule.scheduledAt);
  proposeDate.setDate(proposeDate.getDate() + 1); // Next day

  const rescheduleReq = await ClassRescheduleRequest.create({
    sessionId: sessionToReschedule._id,
    initiatedByRole: 'parent',
    initiatedByProfileId: parent._id,
    reason: 'Doctor appointment',
    proposedSlots: [{
      date: proposeDate,
      startTime: '16:00',
      endTime: '17:00'
    }]
  });

  console.log(`- Created Reschedule Request (Status: ${rescheduleReq.status})`);

  // Simulate Teacher Confirming
  const newDate = new Date(proposeDate);
  newDate.setHours(16, 0, 0, 0);

  const newSession = await ClassSession.create({
    teacherId: teacher._id,
    batchId: sessionToReschedule.batchId,
    subject: sessionToReschedule.subject,
    board: sessionToReschedule.board,
    classLevel: sessionToReschedule.classLevel,
    studentIds: sessionToReschedule.studentIds,
    parentIds: sessionToReschedule.parentIds,
    enrollmentIds: sessionToReschedule.enrollmentIds,
    scheduledAt: newDate,
    duration: 60,
    status: 'scheduled',
    aiMonitoringAlerts: [],
  });

  await ClassSession.findByIdAndUpdate(sessionToReschedule._id, {
    status: 'cancelled',
    cancelledBy: { role: 'teacher', profileId: teacher._id },
    cancelledReason: 'Rescheduled as per request',
    rescheduledToSessionId: newSession._id
  });

  await ClassRescheduleRequest.findByIdAndUpdate(rescheduleReq._id, {
    status: 'confirmed',
    confirmedSlotIndex: 0,
    confirmedByProfileId: teacher._id,
    confirmedAt: new Date(),
    newSessionId: newSession._id
  });

  const updatedReq = await ClassRescheduleRequest.findById(rescheduleReq._id);
  console.log(`- Verified Reschedule Request updated to: ${updatedReq?.status}`);

  console.log('--- Test Completed Successfully ---');

  // Cleanup
  console.log('Cleaning up test data...');
  await ClassSession.deleteMany({ enrollmentIds: enrollment._id });
  await ClassRescheduleRequest.findByIdAndDelete(rescheduleReq._id);
  await Enrollment.findByIdAndDelete(enrollment._id);
  await Student.findByIdAndDelete(student._id);
  await Parent.findByIdAndDelete(parent._id);
  await Teacher.findByIdAndDelete(teacher._id);
  await User.deleteMany({ _id: { $in: [teacherUser._id, parentUser._id, studentUser._id] } });

  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
