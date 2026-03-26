import mongoose from 'mongoose';
import connectDB from '../src/lib/db';
import { User } from '../src/lib/models/User';
import { Teacher } from '../src/lib/models/Teacher';
import { Parent } from '../src/lib/models/Parent';
import { Student } from '../src/lib/models/Student';
import { Enrollment } from '../src/lib/models/Enrollment';
import { PendingEnrollment } from '../src/lib/models/PendingEnrollment';
import { POST } from '../src/api/parent/payment/complete/route';
import { NextRequest } from '../src/lib/next-compat';



async function runTest() {
  console.log('--- Starting Double-Booking Test ---');
  await connectDB();

  const saltStr = Date.now().toString(36);
  
  // 1. Setup: Create Teacher (capacity 3), Parent, 4 Students
  const teacherUser = await User.create({ email: `t_${saltStr}@test.com`, password: 'pwd', role: 'teacher' });
  const teacher = await Teacher.create({
    userId: teacherUser._id,
    name: 'Test Teacher TB',
    status: 'qualified',
    batches: [{
      name: 'Batch DoubleBooking',
      subject: 'Math',
      board: 'CBSE',
      classLevel: '10',
      feePerMonth: 1000,
      startDate: new Date(),
      maxStudents: 3,
      slots: [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }]
    }]
  });

  const parentUser = await User.create({ email: `p_${saltStr}@test.com`, password: 'pwd', role: 'parent' });
  const parent = await Parent.create({
    userId: parentUser._id,
    children: [],
  });

  // Create 4 Pending Enrollments for the same batch
  const pendings = [];
  for (let i = 0; i < 4; i++) {
    const studentUser = await User.create({ email: `s_${saltStr}_${i}@test.com`, password: 'pwd', role: 'student' });
    const student = await Student.create({
      userId: studentUser._id,
      parentId: parent._id,
      name: `Test Student ${i}`,
      classLevel: '10',
      board: 'CBSE',
    });
    parent.children.push(student._id);

    const pending = await PendingEnrollment.create({
      parentId: parent._id,
      teacherId: teacher._id,
      batchIndex: 0,
      studentDetails: { name: student.name, classLevel: '10' },
      intendedStudentId: student._id,
      paymentStatus: 'pending',
      duration: '3months',
      totalAmount: 3000,
    });
    pendings.push(pending);
  }
  await parent.save();

  // 2. Perform concurrent payment complete requests
  console.log('Sending 4 concurrent payment complete requests for a batch with max capacity 3...');

  const results = await Promise.allSettled(
    pendings.map(async (pending, index) => {
      // Create mock request
      const req = {
        json: async () => ({ pendingId: String(pending._id) }),
        headers: new Headers({ 'X-Auth-Payload': JSON.stringify({ userId: String(parentUser._id), role: 'parent' }) })
      };
      
      const response = await POST(req as any);
      const data = await response.json();
      return { index, status: response.status, data };
    })
  );

  let successCount = 0;
  let failureCount = 0;

  for (const res of results) {
    if (res.status === 'fulfilled') {
      const val = res.value;
      if (val.status === 200) {
        successCount++;
        console.log(`Request ${val.index}: SUCCESS`);
      } else {
        failureCount++;
        console.log(`Request ${val.index}: FAILED (${val.status}) - ${val.data.error || JSON.stringify(val.data)}`);
      }
    } else {
      console.log(`Request FAILED: ${res.reason}`);
      failureCount++;
    }
  }

  console.log(`\nResults: ${successCount} Successful Enrollments, ${failureCount} Failures.`);
  
  if (successCount === 3 && failureCount === 1) {
    console.log('TEST PASSED: Exactly 3 enrollments succeeded, preventing double-booking.');
  } else {
    console.error(`TEST FAILED: Expected 3 successes and 1 failure, got ${successCount} successes and ${failureCount} failures.`);
    process.exitCode = 1;
  }

  // Cleanup
  console.log('Cleaning up...');
  await Enrollment.deleteMany({ teacherId: teacher._id });
  await PendingEnrollment.deleteMany({ teacherId: teacher._id });
  await Student.deleteMany({ parentId: parent._id });
  await Parent.findByIdAndDelete(parent._id);
  await Teacher.findByIdAndDelete(teacher._id);
  await User.deleteMany({ _id: { $in: [teacherUser._id, parentUser._id, ...(pendings.map(p => p.intendedStudentId) as mongoose.Types.ObjectId[])] } });

  process.exit();
}

runTest();
