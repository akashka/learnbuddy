#!/usr/bin/env tsx
/**
 * Enterprise-level seed: 1000+ records for every entity.
 * Run: npx tsx scripts/seed-all.ts [--clear]
 * --clear: Drop all seeded collections before seeding (use with caution)
 *
 * Dummy phone/email for all records - safe for dev/test.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/lib/models/User';
import { AdminStaff } from '../src/lib/models/AdminStaff';
import { Parent } from '../src/lib/models/Parent';
import { Teacher } from '../src/lib/models/Teacher';
import { Student } from '../src/lib/models/Student';
import { Enrollment } from '../src/lib/models/Enrollment';
import { ClassSession } from '../src/lib/models/ClassSession';
import { BoardClassSubject } from '../src/lib/models/BoardClassSubject';
import { Topic } from '../src/lib/models/Topic';
import { TeacherReview } from '../src/lib/models/TeacherReview';
import { ParentWishlist } from '../src/lib/models/ParentWishlist';
import { Notification } from '../src/lib/models/Notification';
import { PaymentDispute } from '../src/lib/models/PaymentDispute';
import { TeacherPayment } from '../src/lib/models/TeacherPayment';
import { ClassRescheduleRequest } from '../src/lib/models/ClassRescheduleRequest';
import { JobPosition } from '../src/lib/models/JobPosition';
import { JobApplication } from '../src/lib/models/JobApplication';
import { ContactSubmission } from '../src/lib/models/ContactSubmission';
import { AuditLog } from '../src/lib/models/AuditLog';
import { DiscountCode } from '../src/lib/models/DiscountCode';
import { DISCOUNT_CODE_SEED } from '../src/lib/discount-code-seed';
import { hashPassword } from '../src/lib/auth';
import {
  BOARDS,
  CLASSES,
  getSubjectsForBoardAndClass,
  generateName,
  generateParentEmail,
  generateTeacherEmail,
  generateStudentId,
  generateStudentEmail,
  generatePhone,
  generateLocation,
  generateSchool,
  generateProfession,
  generateLanguages,
  generateSlot,
  generateReview,
  generateDisputeSubject,
  generateJobTitle,
  generateJobTeam,
  generateJobLocation,
  generateContactSubject,
  pick,
  pickRandom,
  randomInt,
} from '../src/lib/enterprise-seed-data';
import { getBoardClassSubjectMappings, getDefaultTopicsForSeeding } from '../src/lib/seed-data';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

const CLEAR_FIRST = process.argv.includes('--clear');

// Target counts (1000+ for main entities)
const COUNTS = {
  parents: 1200,
  teachers: 450,
  students: 2000,
  enrollments: 3500,
  classSessions: 5000,
  teacherReviews: 2500,
  parentWishlist: 1800,
  notifications: 4000,
  paymentDisputes: 400,
  teacherPayments: 1200,
  rescheduleRequests: 600,
  jobPositions: 80,
  jobApplications: 1200,
  contactSubmissions: 800,
  auditLogs: 3000,
};

const DEFAULT_PASSWORD = 'Welcome123';

/** Insert docs, skip duplicates (continue on duplicate key error). Returns inserted count. */
async function insertManySkipDuplicates<T>(
  Model: mongoose.Model<T>,
  docs: object[]
): Promise<{ inserted: number; skipped: number }> {
  if (docs.length === 0) return { inserted: 0, skipped: 0 };
  try {
    const result = await Model.insertMany(docs, { ordered: false });
    return { inserted: result.length, skipped: 0 };
  } catch (err: unknown) {
    const e = err as { insertedIds?: Record<number, unknown>; writeErrors?: { code: number }[] };
    const inserted = e.insertedIds ? Object.keys(e.insertedIds).length : 0;
    const skipped = (e.writeErrors?.length ?? 0);
    return { inserted, skipped };
  }
}

const NOTIFICATION_TYPES = [
  'course_purchased',
  'reschedule_request',
  'reschedule_confirmed',
  'reschedule_rejected',
  'class_cancelled',
  'exam_completed',
  'ai_content_generated',
  'class_reminder_15min',
  'batch_start_reminder',
  'payment_reminder',
  'ai_review_requested',
  'ai_review_resolved',
] as const;

async function clearCollections() {
  const collections = [
    'auditlogs',
    'contactsubmissions',
    'jobapplications',
    'jobpositions',
    'classreschedulerequests',
    'teacherpayments',
    'paymentdisputes',
    'notifications',
    'parentwishlists',
    'teacherreviews',
    'classsessions',
    'enrollments',
    'students',
    'teachers',
    'parents',
    'adminstaffs',
    'topics',
    'boardclasssubjects',
    'users',
  ];
  for (const name of collections) {
    try {
      await mongoose.connection.db?.collection(name).drop();
      console.log(`  Dropped ${name}`);
    } catch (e: unknown) {
      if ((e as { code?: number })?.code !== 26) console.log(`  Skip ${name} (may not exist)`);
    }
  }
}

async function seedBoardClassSubjects() {
  const mappings = getBoardClassSubjectMappings();
  const ops = mappings.map((m) => ({
    updateOne: {
      filter: { board: m.board, classLevel: m.classLevel },
      update: { $set: { subjects: m.subjects, isActive: true } },
      upsert: true,
    },
  }));
  const result = await BoardClassSubject.bulkWrite(ops);
  console.log(`  BoardClassSubject: ${result.upsertedCount + result.modifiedCount} upserted`);
}

async function seedTopics() {
  const topics = getDefaultTopicsForSeeding();
  const ops = topics.map((t) => ({
    updateOne: {
      filter: { board: t.board, classLevel: t.classLevel, subject: t.subject, topic: t.topic },
      update: { $set: { displayOrder: t.displayOrder, isActive: true } },
      upsert: true,
    },
  }));
  const result = await Topic.bulkWrite(ops);
  console.log(`  Topics: ${result.upsertedCount + result.modifiedCount} upserted`);
}

async function seedUsers(
  parentCount: number,
  teacherCount: number,
  studentCount: number
): Promise<{ parentUserIds: mongoose.Types.ObjectId[]; teacherUserIds: mongoose.Types.ObjectId[]; studentUserIds: mongoose.Types.ObjectId[] }> {
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  const parentEmails = Array.from({ length: parentCount }, (_, i) => generateParentEmail(i));
  const teacherEmails = Array.from({ length: teacherCount }, (_, i) => generateTeacherEmail(i));
  const studentEmails = Array.from({ length: studentCount }, (_, i) =>
    generateStudentEmail(generateStudentId(i + 1))
  );

  const existingParentUsers = await User.find({ email: { $in: parentEmails } }).select('_id email').lean();
  const existingTeacherUsers = await User.find({ email: { $in: teacherEmails } }).select('_id email').lean();
  const existingStudentUsers = await User.find({ email: { $in: studentEmails } }).select('_id email').lean();

  const existingParentEmailSet = new Set(existingParentUsers.map((u) => u.email));
  const existingTeacherEmailSet = new Set(existingTeacherUsers.map((u) => u.email));
  const existingStudentEmailSet = new Set(existingStudentUsers.map((u) => u.email));

  const parentDocs = parentEmails
    .map((email, i) => (existingParentEmailSet.has(email) ? null : { email, password: hashedPassword, role: 'parent' as const, isActive: i % 50 !== 0 }))
    .filter(Boolean) as object[];
  const teacherDocs = teacherEmails
    .map((email, i) => (existingTeacherEmailSet.has(email) ? null : { email, password: hashedPassword, role: 'teacher' as const, isActive: i % 40 !== 0 }))
    .filter(Boolean) as object[];
  const studentDocs = studentEmails
    .map((email) => (existingStudentEmailSet.has(email) ? null : { email, password: hashedPassword, role: 'student' as const, isActive: true }))
    .filter(Boolean) as object[];

  let newParentUsers: { _id: mongoose.Types.ObjectId; email: string }[] = [];
  let newTeacherUsers: { _id: mongoose.Types.ObjectId; email: string }[] = [];
  let newStudentUsers: { _id: mongoose.Types.ObjectId; email: string }[] = [];

  if (parentDocs.length > 0) {
    newParentUsers = await User.insertMany(parentDocs);
  }
  if (teacherDocs.length > 0) {
    newTeacherUsers = await User.insertMany(teacherDocs);
  }
  if (studentDocs.length > 0) {
    newStudentUsers = await User.insertMany(studentDocs);
  }

  const emailToUserId = new Map<string, mongoose.Types.ObjectId>();
  [...existingParentUsers, ...existingTeacherUsers, ...existingStudentUsers].forEach((u) => {
    emailToUserId.set(u.email, u._id);
  });
  [...newParentUsers, ...newTeacherUsers, ...newStudentUsers].forEach((u) => {
    emailToUserId.set(u.email, u._id);
  });

  const parentUserIds = parentEmails.map((e) => emailToUserId.get(e)!).filter(Boolean);
  const teacherUserIds = teacherEmails.map((e) => emailToUserId.get(e)!).filter(Boolean);
  const studentUserIds = studentEmails.map((e) => emailToUserId.get(e)!).filter(Boolean);

  let adminUser = await User.findOne({ email: 'admin@example.com' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
  }

  console.log(`  Users: ${parentUserIds.length} parents, ${teacherUserIds.length} teachers, ${studentUserIds.length} students (${newParentUsers.length + newTeacherUsers.length + newStudentUsers.length} new)`);
  return { parentUserIds, teacherUserIds, studentUserIds };
}

async function seedAdminStaff() {
  const staff = [
    { email: 'admin@example.com', name: 'Super Admin', staffRole: 'admin' as const },
    { email: 'sales@example.com', name: 'Sales Lead', staffRole: 'sales' as const },
    { email: 'marketing@example.com', name: 'Marketing Manager', staffRole: 'marketing' as const },
    { email: 'hr@example.com', name: 'HR Coordinator', staffRole: 'hr' as const },
    { email: 'finance@example.com', name: 'Finance Analyst', staffRole: 'finance' as const },
  ];
  for (const s of staff) {
    const user = await User.findOne({ email: s.email });
    if (user) {
      const existing = await AdminStaff.findOne({ userId: user._id });
      if (!existing) {
        await AdminStaff.create({
          userId: user._id,
          name: s.name,
          email: s.email,
          phone: '+91 9999900001',
          staffRole: s.staffRole,
          position: s.staffRole,
          department: s.staffRole,
          isActive: true,
        });
      }
    }
  }
  console.log(`  AdminStaff: ${staff.length}`);
}

async function seedParents(
  parentUserIds: mongoose.Types.ObjectId[]
): Promise<{ parentIds: mongoose.Types.ObjectId[] }> {
  const existingParents = await Parent.find({ userId: { $in: parentUserIds } }).select('_id userId').lean();
  const existingUserIds = new Set(existingParents.map((p) => String(p.userId)));

  const toCreate = parentUserIds
    .map((userId, i) =>
      existingUserIds.has(String(userId))
        ? null
        : { userId, name: generateName(i), phone: generatePhone(100000 + i), location: generateLocation(i), children: [] as mongoose.Types.ObjectId[] }
    )
    .filter(Boolean) as { userId: mongoose.Types.ObjectId; name: string; phone: string; location: string; children: mongoose.Types.ObjectId[] }[];

  const userIdToParentId = new Map<string, mongoose.Types.ObjectId>();
  existingParents.forEach((p) => userIdToParentId.set(String(p.userId), p._id));

  if (toCreate.length > 0) {
    const newParents = await Parent.insertMany(toCreate);
    newParents.forEach((p) => userIdToParentId.set(String(p.userId), p._id));
  }

  const parentIds = parentUserIds.map((uid) => userIdToParentId.get(String(uid))!).filter(Boolean);
  console.log(`  Parents: ${parentIds.length} (${toCreate.length} new)`);
  return { parentIds };
}

async function seedTeachers(
  teacherUserIds: mongoose.Types.ObjectId[]
): Promise<{ teacherIds: mongoose.Types.ObjectId[]; teacherBatches: Map<string, { batchId: string; slots: { day: string; startTime: string; endTime: string }[] }[]> }> {
  const existingTeachers = await Teacher.find({ userId: { $in: teacherUserIds } }).select('_id userId').lean();
  const existingUserIds = new Set(existingTeachers.map((t) => String(t.userId)));
  const userIdToTeacherId = new Map<string, mongoose.Types.ObjectId>();
  existingTeachers.forEach((t) => userIdToTeacherId.set(String(t.userId), t._id));

  const statuses: Array<'pending' | 'qualified' | 'rejected' | 'suspended'> = ['qualified', 'qualified', 'qualified', 'pending', 'rejected', 'suspended'];
  const aiPerf: Array<'green' | 'yellow' | 'red'> = ['green', 'green', 'yellow', 'red'];
  const teacherBatches = new Map<string, { batchId: string; slots: { day: string; startTime: string; endTime: string }[] }[]>();

  const docs = teacherUserIds
    .map((userId, i) => {
      if (existingUserIds.has(String(userId))) return null;
    const board = pick(BOARDS, i);
    const classLevel = pick(CLASSES, i);
    const subjects = getSubjectsForBoardAndClass(board, classLevel);
    const status = pick(statuses, i);
    const batches: { name: string; slots: { day: string; startTime: string; endTime: string }[]; minStudents: number; maxStudents: number; feePerMonth: number; subject: string; board: string; classLevel: string; isActive: boolean; startDate?: Date; enrollmentOpen: boolean }[] = [];

    if (status === 'qualified' && subjects.length > 0) {
      const numBatches = 1 + (i % 3);
      for (let b = 0; b < numBatches; b++) {
        const subj = pick(subjects, b);
        const slot = generateSlot(i + b * 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - randomInt(0, 60));
        batches.push({
          name: `${subj} ${classLevel} Batch ${b + 1}`,
          slots: [slot],
          minStudents: 1,
          maxStudents: 3,
          feePerMonth: 1500 + (i % 20) * 100,
          subject: subj,
          board,
          classLevel,
          isActive: true,
          startDate,
          enrollmentOpen: true,
        });
      }
    }

      return {
        userId,
        name: generateName(i + 5000),
        phone: generatePhone(200000 + i),
        qualification: ['B.Sc', 'B.Ed', 'M.Sc', 'M.A', 'B.Tech', 'Ph.D'][i % 6],
        profession: generateProfession(i),
        languages: generateLanguages(i),
        experienceMonths: 12 + (i % 120),
        aiExamPerformance: pick(aiPerf, i),
        board: [board],
        classes: [classLevel],
        subjects,
        qualificationExamAttempts: 1,
        status,
        documents: [],
        batches,
        bio: 'Experienced teacher.',
        commissionPercent: 10,
        marketplaceOrder: i + 1,
      };
    })
    .filter(Boolean) as object[];

  if (docs.length > 0) {
    const teachers = await Teacher.insertMany(docs);
    teachers.forEach((t, i) => {
      const d = docs[i] as { batches?: { name: string; slots: { day: string; startTime: string; endTime: string }[] }[] };
      const batches = d?.batches ?? [];
      teacherBatches.set(String(t._id), batches.map((b) => ({ batchId: b.name, slots: b.slots })));
      userIdToTeacherId.set(String(t.userId), t._id);
    });
  }

  const teacherIds = teacherUserIds.map((uid) => userIdToTeacherId.get(String(uid))!).filter(Boolean);
  const existingTeachersWithBatches = await Teacher.find({ _id: { $in: teacherIds } }).select('batches').lean();
  existingTeachersWithBatches.forEach((t) => {
    if (t.batches?.length) {
      teacherBatches.set(String(t._id), t.batches.map((b) => ({ batchId: b.name, slots: b.slots || [] })));
    }
  });
  console.log(`  Teachers: ${teacherIds.length} (${docs.length} new)`);
  return { teacherIds, teacherBatches };
}

async function seedStudents(
  parentIds: mongoose.Types.ObjectId[],
  studentUserIds: mongoose.Types.ObjectId[]
): Promise<{ studentIds: mongoose.Types.ObjectId[]; studentParentMap: Map<string, mongoose.Types.ObjectId> }> {
  const studentIdsToCreate = Array.from({ length: studentUserIds.length }, (_, i) => generateStudentId(i + 1));
  const existingStudents = await Student.find({ studentId: { $in: studentIdsToCreate } }).select('_id studentId parentId').lean();
  const existingStudentIdSet = new Set(existingStudents.map((s) => s.studentId));

  const studentDocs: { studentId: string; userId: mongoose.Types.ObjectId; parentId: mongoose.Types.ObjectId; name: string; dateOfBirth: Date; board: string; classLevel: string; schoolName: string; enrollments: mongoose.Types.ObjectId[] }[] = [];
  let studentIdx = 0;
  for (let pi = 0; pi < parentIds.length && studentIdx < studentUserIds.length; pi++) {
    const numChildren = 1 + (pi % 3);
    for (let c = 0; c < numChildren && studentIdx < studentUserIds.length; c++) {
      const studentId = generateStudentId(studentIdx + 1);
      if (!existingStudentIdSet.has(studentId)) {
        const board = pick(BOARDS, studentIdx);
        const classLevel = pick(CLASSES, studentIdx);
        const dob = new Date(2010 - parseInt(classLevel, 10), studentIdx % 12, 1 + (studentIdx % 28));
        studentDocs.push({
          studentId,
          userId: studentUserIds[studentIdx],
          parentId: parentIds[pi],
          name: generateName(studentIdx + 10000),
          dateOfBirth: dob,
          board,
          classLevel,
          schoolName: generateSchool(studentIdx),
          enrollments: [],
        });
      }
      studentIdx++;
    }
  }

  const studentIdToDoc = new Map<string, { parentId: mongoose.Types.ObjectId; idx: number }>();
  studentDocs.forEach((d, i) => studentIdToDoc.set(d.studentId, { parentId: d.parentId, idx: i }));

  const existingStudentIdToId = new Map<string, mongoose.Types.ObjectId>();
  existingStudents.forEach((s) => existingStudentIdToId.set(s.studentId, s._id));

  let newStudents: { _id: mongoose.Types.ObjectId; studentId: string; parentId: mongoose.Types.ObjectId }[] = [];
  if (studentDocs.length > 0) {
    newStudents = await Student.insertMany(studentDocs);
    newStudents.forEach((s) => existingStudentIdToId.set(s.studentId, s._id));
  }

  const allStudentIds: mongoose.Types.ObjectId[] = [];
  studentIdx = 0;
  const parentChildUpdates: { parentId: mongoose.Types.ObjectId; childIds: mongoose.Types.ObjectId[] }[] = [];
  for (let pi = 0; pi < parentIds.length && studentIdx < studentUserIds.length; pi++) {
    const numChildren = 1 + (pi % 3);
    const childIds: mongoose.Types.ObjectId[] = [];
    for (let c = 0; c < numChildren && studentIdx < studentUserIds.length; c++) {
      const studentId = generateStudentId(studentIdx + 1);
      const sid = existingStudentIdToId.get(studentId);
      if (sid) {
        childIds.push(sid);
        allStudentIds.push(sid);
      }
      studentIdx++;
    }
    if (childIds.length > 0) {
      parentChildUpdates.push({ parentId: parentIds[pi], childIds });
    }
  }

  if (parentChildUpdates.length > 0) {
    const parentUpdateOps = parentChildUpdates.map(({ parentId, childIds }) => ({
      updateOne: { filter: { _id: parentId }, update: { $addToSet: { children: { $each: childIds } } } },
    }));
    await Parent.bulkWrite(parentUpdateOps);
  }

  const studentParentMap = new Map<string, mongoose.Types.ObjectId>();
  [...existingStudents, ...newStudents].forEach((s) => studentParentMap.set(String(s._id), s.parentId));
  console.log(`  Students: ${allStudentIds.length} (${newStudents.length} new)`);
  return { studentIds: allStudentIds, studentParentMap };
}

async function seedEnrollments(
  studentIds: mongoose.Types.ObjectId[],
  teacherIds: mongoose.Types.ObjectId[]
): Promise<{ enrollmentIds: mongoose.Types.ObjectId[]; enrollmentDetails: Map<string, { teacherId: mongoose.Types.ObjectId; batchId: string; slots: { day: string; startTime: string; endTime: string }[]; subject: string; board: string; classLevel: string; feePerMonth: number }> }> {
  const qualifiedTeachers = await Teacher.find({ status: 'qualified' }).lean();
  const students = await Student.find({ _id: { $in: studentIds } }).lean();
  const enrollmentDetails = new Map<string, { teacherId: mongoose.Types.ObjectId; batchId: string; slots: { day: string; startTime: string; endTime: string }[]; subject: string; board: string; classLevel: string; feePerMonth: number }>();

  const statuses: Array<'active' | 'completed' | 'cancelled'> = ['active', 'active', 'completed', 'completed', 'cancelled'];
  const paymentStatuses: Array<'pending' | 'completed' | 'failed'> = ['completed', 'completed', 'completed', 'pending', 'failed'];
  const durations: Array<'3months' | '6months' | '12months'> = ['3months', '6months', '12months'];

  const enrollmentDocs: object[] = [];
  const studentEnrollmentUpdates: { studentId: mongoose.Types.ObjectId; enrollmentId: mongoose.Types.ObjectId }[] = [];

  for (let i = 0; i < COUNTS.enrollments; i++) {
    const student = pick(students, i);
    if (!student) continue;
    let matchingTeachers = qualifiedTeachers.filter(
      (t) =>
        t.batches?.length &&
        t.board?.includes(student.board) &&
        t.classes?.includes(student.classLevel)
    );
    if (matchingTeachers.length === 0) {
      matchingTeachers = qualifiedTeachers.filter((t) => t.batches?.length);
    }
    const teacher = pickRandom(matchingTeachers);
    if (!teacher || !teacher.batches?.length) continue;
    const batch = teacher.batches.find((b) => b.board === student.board && b.classLevel === student.classLevel)
      ?? teacher.batches.find((b) => b.classLevel === student.classLevel)
      ?? teacher.batches[0];
    const subjectMatch = batch.subject && (teacher.subjects?.includes(batch.subject) ?? true);
    if (!subjectMatch) continue;

    const duration = pick(durations, i);
    const feePerMonth = batch.feePerMonth ?? 2000;
    const months = duration === '3months' ? 3 : duration === '6months' ? 6 : 12;
    const totalAmount = feePerMonth * months * (1 - (i % 5 === 0 ? 0.1 : 0));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - randomInt(0, 90));
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const status = pick(statuses, i);
    const paymentStatus = status === 'cancelled' ? pick(['completed', 'failed'], i) : pick(paymentStatuses, i);

    enrollmentDocs.push({
      studentId: student._id,
      teacherId: teacher._id,
      batchId: batch.name,
      subject: batch.subject,
      board: student.board,
      classLevel: student.classLevel,
      slots: batch.slots || [],
      feePerMonth,
      duration,
      discount: i % 10 === 0 ? 10 : i % 5 === 0 ? 5 : 0,
      totalAmount,
      paymentStatus,
      status,
      startDate,
      endDate,
    });
  }

  const enrollments = await Enrollment.insertMany(enrollmentDocs);
  const enrollmentIds = enrollments.map((e) => e._id);

  enrollments.forEach((e, i) => {
    const doc = enrollmentDocs[i] as { studentId: mongoose.Types.ObjectId };
    if (doc?.studentId) studentEnrollmentUpdates.push({ studentId: doc.studentId, enrollmentId: e._id });
    enrollmentDetails.set(String(e._id), {
      teacherId: (doc as { teacherId: mongoose.Types.ObjectId }).teacherId,
      batchId: (doc as { batchId: string }).batchId,
      slots: (doc as { slots: { day: string; startTime: string; endTime: string }[] }).slots || [],
      subject: (doc as { subject: string }).subject,
      board: (doc as { board: string }).board,
      classLevel: (doc as { classLevel: string }).classLevel,
      feePerMonth: (doc as { feePerMonth: number }).feePerMonth,
    });
  });

  const studentUpdateOps = studentEnrollmentUpdates.map(({ studentId, enrollmentId }) => ({
    updateOne: { filter: { _id: studentId }, update: { $push: { enrollments: enrollmentId } } },
  }));
  if (studentUpdateOps.length > 0) {
    await Student.bulkWrite(studentUpdateOps);
  }
  console.log(`  Enrollments: ${enrollmentIds.length}`);
  return { enrollmentIds, enrollmentDetails };
}

async function seedClassSessions(
  teacherIds: mongoose.Types.ObjectId[],
  enrollments: { studentId: mongoose.Types.ObjectId; teacherId: mongoose.Types.ObjectId; batchId: string; slots: { day: string; startTime: string; endTime: string }[]; subject?: string; board?: string; classLevel?: string }[]
) {
  const statuses: Array<'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = ['completed', 'completed', 'completed', 'scheduled', 'cancelled'];
  const now = new Date();
  const sessionDocs: object[] = [];

  for (let i = 0; i < COUNTS.classSessions; i++) {
    const enrollment = pickRandom(enrollments);
    if (!enrollment || !enrollment.slots?.length) continue;
    const slot = pick(enrollment.slots, i);
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() - randomInt(0, 60));
    scheduledAt.setHours(parseInt(slot.startTime?.split(':')[0] || '10', 10), parseInt(slot.startTime?.split(':')[1] || '0', 10), 0, 0);

    sessionDocs.push({
      teacherId: enrollment.teacherId,
      studentIds: [enrollment.studentId],
      batchId: enrollment.batchId,
      subject: enrollment.subject ?? 'Mathematics',
      board: enrollment.board ?? 'CBSE',
      classLevel: enrollment.classLevel ?? '10',
      scheduledAt,
      duration: 60,
      status: pick(statuses, i),
    });
  }
  await ClassSession.insertMany(sessionDocs);
  console.log(`  ClassSessions: ${sessionDocs.length}`);
}

async function seedTeacherReviews(
  parentIds: mongoose.Types.ObjectId[],
  teacherIds: mongoose.Types.ObjectId[]
) {
  const reviews: { teacherId: mongoose.Types.ObjectId; parentId: mongoose.Types.ObjectId; rating: number; review: string }[] = [];
  for (let i = 0; i < COUNTS.teacherReviews; i++) {
    const teacherId = pick(teacherIds, i);
    const parentId = pick(parentIds, i + 100);
    reviews.push({
      teacherId,
      parentId,
      rating: 1 + (i % 5),
      review: generateReview(i),
    });
  }
  await TeacherReview.insertMany(reviews);
  console.log(`  TeacherReviews: ${reviews.length}`);
}

async function seedParentWishlist(parentIds: mongoose.Types.ObjectId[], teacherIds: mongoose.Types.ObjectId[]) {
  const seen = new Set<string>();
  const items: object[] = [];
  for (let i = 0; i < COUNTS.parentWishlist; i++) {
    const key = `${parentIds[i % parentIds.length]}-${teacherIds[i % teacherIds.length]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ parentId: parentIds[i % parentIds.length], teacherId: teacherIds[i % teacherIds.length] });
  }
  const { inserted, skipped } = await insertManySkipDuplicates(ParentWishlist, items);
  console.log(`  ParentWishlist: ${inserted + skipped} (${inserted} new, ${skipped} skipped)`);
}

async function seedNotifications(
  parentUserIds: mongoose.Types.ObjectId[],
  teacherUserIds: mongoose.Types.ObjectId[],
  studentUserIds: mongoose.Types.ObjectId[]
) {
  const allUserIds = [...parentUserIds, ...teacherUserIds, ...studentUserIds];
  const notifications: { userId: mongoose.Types.ObjectId; type: string; title: string; message: string; read: boolean; entityType?: string; entityId?: string }[] = [];
  const titles: Record<string, string> = {
    course_purchased: 'Course Purchased',
    reschedule_request: 'Reschedule Request',
    reschedule_confirmed: 'Reschedule Confirmed',
    class_cancelled: 'Class Cancelled',
    exam_completed: 'Exam Completed',
    ai_content_generated: 'AI Content Ready',
    class_reminder_15min: 'Class in 15 minutes',
    batch_start_reminder: 'Batch Starting Soon',
    payment_reminder: 'Payment Reminder',
    ai_review_requested: 'AI Review Requested',
    ai_review_resolved: 'AI Review Resolved',
  };
  for (let i = 0; i < COUNTS.notifications; i++) {
    const userId = pick(allUserIds, i);
    const type = pick(NOTIFICATION_TYPES, i);
    notifications.push({
      userId,
      type,
      title: titles[type] || type,
      message: `Notification ${i + 1} for ${type}`,
      read: i % 3 === 0,
      entityType: 'enrollment',
      entityId: String(i),
    });
  }
  await Notification.insertMany(notifications);
  console.log(`  Notifications: ${notifications.length}`);
}

async function seedPaymentDisputes(
  parentUserIds: mongoose.Types.ObjectId[],
  teacherUserIds: mongoose.Types.ObjectId[]
) {
  const statuses: Array<'open' | 'in_review' | 'resolved' | 'rejected'> = ['open', 'in_review', 'resolved', 'resolved', 'rejected'];
  const raisedBy: Array<'parent' | 'teacher'> = ['parent', 'teacher'];
  const disputes: object[] = [];
  for (let i = 0; i < COUNTS.paymentDisputes; i++) {
    const by = pick(raisedBy, i);
    const userId = by === 'parent' ? pick(parentUserIds, i) : pick(teacherUserIds, i);
    disputes.push({
      raisedBy: by,
      userId,
      referenceType: 'enrollment',
      referenceId: `REF${i}`,
      subject: generateDisputeSubject(i),
      description: `Dispute description for case ${i + 1}. Dummy data for testing.`,
      status: pick(statuses, i),
    });
  }
  await PaymentDispute.insertMany(disputes);
  console.log(`  PaymentDisputes: ${disputes.length}`);
}

async function seedTeacherPayments(teacherIds: mongoose.Types.ObjectId[]) {
  const statuses: Array<'pending' | 'paid' | 'failed'> = ['paid', 'paid', 'paid', 'pending', 'failed'];
  const payments: object[] = [];
  const now = new Date();
  for (let i = 0; i < COUNTS.teacherPayments; i++) {
    const periodStart = new Date(now);
    periodStart.setMonth(periodStart.getMonth() - (i % 24));
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    payments.push({
      teacherId: pick(teacherIds, i),
      amount: 5000 + (i % 50) * 500,
      grossAmount: 6000 + (i % 50) * 600,
      commissionAmount: 600 + (i % 50) * 60,
      commissionPercent: 10,
      periodStart,
      periodEnd,
      status: pick(statuses, i),
      paidAt: pick(statuses, i) === 'paid' ? periodEnd : undefined,
    });
  }
  await TeacherPayment.insertMany(payments);
  console.log(`  TeacherPayments: ${payments.length}`);
}

async function seedRescheduleRequests(
  classSessions: { _id: mongoose.Types.ObjectId; studentIds?: mongoose.Types.ObjectId[]; parentIds?: mongoose.Types.ObjectId[] }[]
) {
  const statuses: Array<'pending' | 'confirmed' | 'rejected' | 'expired'> = ['confirmed', 'confirmed', 'rejected', 'expired', 'pending'];
  const requests: object[] = [];
  const sessions = await ClassSession.find().limit(COUNTS.rescheduleRequests).lean();
  for (let i = 0; i < Math.min(COUNTS.rescheduleRequests, sessions.length); i++) {
    const session = sessions[i];
    if (!session) continue;
    const proposedDate = new Date(session.scheduledAt);
    proposedDate.setDate(proposedDate.getDate() + 2);
    requests.push({
      sessionId: session._id,
      initiatedByRole: 'parent',
      initiatedByProfileId: session.parentIds?.[0] ?? session.studentIds?.[0] ?? session._id,
      reason: `Reschedule reason ${i + 1}`,
      proposedSlots: [{ date: proposedDate, startTime: '10:00', endTime: '11:00' }],
      status: pick(statuses, i),
    });
  }
  if (requests.length > 0) await ClassRescheduleRequest.insertMany(requests);
  console.log(`  ClassRescheduleRequests: ${requests.length}`);
}

async function seedJobPositions() {
  const positions: object[] = [];
  for (let i = 0; i < COUNTS.jobPositions; i++) {
    positions.push({
      title: generateJobTitle(i),
      team: generateJobTeam(i),
      type: ['Full-time', 'Part-time', 'Contract'][i % 3],
      location: generateJobLocation(i),
      description: `Job description for position ${i + 1}. Dummy data.`,
      jdUrl: `https://example.com/jobs/${i}`,
      status: i % 5 === 0 ? 'closed' : 'open',
    });
  }
  await JobPosition.insertMany(positions);
  const created = await JobPosition.find().lean();
  console.log(`  JobPositions: ${created.length}`);
  return created;
}

async function seedJobApplications(jobPositions: { _id: mongoose.Types.ObjectId }[]) {
  const statuses: Array<'new' | 'viewed' | 'in_process' | 'approved' | 'rejected'> = ['new', 'viewed', 'in_process', 'approved', 'rejected'];
  const applications: object[] = [];
  for (let i = 0; i < COUNTS.jobApplications; i++) {
    applications.push({
      positionId: pick(jobPositions, i)._id,
      name: generateName(i + 20000),
      email: `applicant.seed${i}@test.learnbuddy.local`,
      phone: generatePhone(300000 + i),
      resumeUrl: `https://example.com/resumes/${i}.pdf`,
      coverLetter: `Cover letter for application ${i + 1}.`,
      status: pick(statuses, i),
      remarks: i % 10 === 0 ? 'Shortlisted' : '',
    });
  }
  await JobApplication.insertMany(applications);
  console.log(`  JobApplications: ${applications.length}`);
}

async function seedContactSubmissions() {
  const statuses: Array<'open' | 'in_process' | 'closed'> = ['open', 'in_process', 'closed'];
  const submissions: object[] = [];
  for (let i = 0; i < COUNTS.contactSubmissions; i++) {
    submissions.push({
      name: generateName(i + 30000),
      email: `contact.seed${i}@test.learnbuddy.local`,
      phone: generatePhone(400000 + i),
      type: ['concern', 'suggestion', 'feedback', 'other'][i % 4],
      subject: generateContactSubject(i),
      message: `Contact form message ${i + 1}. Dummy data for testing.`,
      status: pick(statuses, i),
    });
  }
  await ContactSubmission.insertMany(submissions);
  console.log(`  ContactSubmissions: ${submissions.length}`);
}

async function seedAuditLogs() {
  const actions = ['login', 'logout', 'create', 'update', 'delete', 'view'];
  const resources = ['teacher', 'student', 'enrollment', 'user', 'payment', 'topic'];
  const logs: object[] = [];
  const adminUser = await User.findOne({ role: 'admin' }).lean();
  const actorId = adminUser?._id;
  for (let i = 0; i < COUNTS.auditLogs; i++) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (i % 90));
    logs.push({
      actorId,
      actorEmail: adminUser?.email ?? 'admin@example.com',
      actorRole: 'admin',
      action: pick(actions, i),
      resourceType: pick(resources, i),
      resourceId: String(i),
      method: pick(['GET', 'POST', 'PUT', 'DELETE'], i),
      path: `/api/admin/${pick(resources, i)}/${i}`,
      statusCode: 200,
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/1.0',
      success: true,
      createdAt,
    });
  }
  await AuditLog.insertMany(logs);
  console.log(`  AuditLogs: ${logs.length}`);
}

async function seedDiscountCodes() {
  let created = 0;
  for (const item of DISCOUNT_CODE_SEED) {
    const existing = await DiscountCode.findOne({ code: item.code });
    if (!existing) {
      await DiscountCode.create(item);
      created++;
    }
  }
  console.log(`  DiscountCodes: ${created} new (${DISCOUNT_CODE_SEED.length} total)`);
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  if (CLEAR_FIRST) {
    console.log('Clearing collections...');
    await clearCollections();
  }

  console.log('\nSeeding enterprise data...\n');

  await seedBoardClassSubjects();
  await seedTopics();

  const { parentUserIds, teacherUserIds, studentUserIds } = await seedUsers(
    COUNTS.parents,
    COUNTS.teachers,
    COUNTS.students
  );

  await seedAdminStaff();

  const { parentIds } = await seedParents(parentUserIds);
  const { teacherIds, teacherBatches } = await seedTeachers(teacherUserIds);
  const { studentIds } = await seedStudents(parentIds, studentUserIds);

  const { enrollmentIds, enrollmentDetails } = await seedEnrollments(studentIds, teacherIds);
  const enrollments = await Enrollment.find().limit(COUNTS.classSessions * 2).lean();

  await seedClassSessions(teacherIds, enrollments);

  await seedTeacherReviews(parentIds, teacherIds);
  await seedParentWishlist(parentIds, teacherIds);
  await seedNotifications(parentUserIds, teacherUserIds, studentUserIds);
  await seedPaymentDisputes(parentUserIds, teacherUserIds);
  await seedTeacherPayments(teacherIds);

  const sessions = await ClassSession.find().limit(COUNTS.rescheduleRequests).lean();
  await seedRescheduleRequests(sessions);

  const jobPositions = await seedJobPositions();
  await seedJobApplications(jobPositions);
  await seedContactSubmissions();
  await seedAuditLogs();
  await seedDiscountCodes();

  console.log('\n✓ Enterprise seed complete.');
  console.log(`  Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log('  Sample logins: parent.seed0@test.learnbuddy.local, teacher.seed0@test.learnbuddy.local');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
