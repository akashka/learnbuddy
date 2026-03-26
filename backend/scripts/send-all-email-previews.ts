#!/usr/bin/env tsx
/**
 * Send all email templates to a test address for preview.
 * Run: npx tsx scripts/send-all-email-previews.ts
 * Requires MAILGUN_API_KEY, MAILGUN_DOMAIN, EMAIL_FROM in .env
 */
import 'dotenv/config';
import { sendTemplatedEmail } from '../src/lib/mailgun-service';

const TEST_EMAIL = 'akash.ka01@gmail.com';

const TEMPLATE_VARIABLES: Record<string, Record<string, string>> = {
  contact_form_confirmation: { name: 'Akash', subject: 'Enrollment inquiry' },
  class_reminder_15min: { subject: 'Mathematics', timeStr: '10:30 AM', ctaUrl: 'https://learnbuddy.com/student/classes' },
  payment_reminder: { studentName: 'Rohan', subject: 'Mathematics', ctaUrl: 'https://learnbuddy.com/parent/dashboard' },
  welcome_parent: { name: 'Akash', ctaUrl: 'https://learnbuddy.com/parent/dashboard' },
  welcome_teacher: { name: 'Akash', ctaUrl: 'https://learnbuddy.com/teacher/profile' },
  email_verification: { name: 'Akash', verifyUrl: 'https://learnbuddy.com/api/auth/verify-email?token=sample-token' },
  batch_start_reminder: { subject: 'Mathematics', batchName: 'Batch A', ctaUrl: 'https://learnbuddy.com/teacher/batches' },
  review_reminder: { teacherName: 'Mrs. Sharma', ctaUrl: 'https://learnbuddy.com/parent/my-teachers' },
  reschedule_request: { subject: 'Science', ctaUrl: 'https://learnbuddy.com/parent/classes' },
  reschedule_confirmed: { subject: 'Science', ctaUrl: 'https://learnbuddy.com/parent/classes' },
  reschedule_rejected: { subject: 'Science', ctaUrl: 'https://learnbuddy.com/parent/classes' },
  course_purchased: { studentName: 'Rohan', subject: 'Mathematics', ctaUrl: 'https://learnbuddy.com/teacher/classes' },
  exam_completed: { studentName: 'Rohan', score: '85', totalMarks: '100', subject: 'Mathematics', ctaUrl: 'https://learnbuddy.com/parent/performances' },
  ai_content_generated: { studentName: 'Rohan', topic: 'Algebra', subject: 'Mathematics', ctaUrl: 'https://learnbuddy.com/parent/students' },
  doubt_answered: { studentName: 'Rohan', subject: 'Physics', ctaUrl: 'https://learnbuddy.com/parent/students' },
  dispute_updated: { status: 'In Review', ctaUrl: 'https://learnbuddy.com/disputes' },
  ai_review_requested: { role: 'parent', entityType: 'an exam', ctaUrl: 'https://learnbuddy.com/ai-review-requests' },
  ai_review_resolved: { resolutionMessage: 'The admin has made corrections and updated the content/marks.', ctaUrl: 'https://learnbuddy.com/parent/review-requests' },
};

async function main() {
  const templates = Object.keys(TEMPLATE_VARIABLES);
  console.log(`Sending ${templates.length} email previews to ${TEST_EMAIL}...\n`);

  for (const code of templates) {
    const vars = TEMPLATE_VARIABLES[code];
    const result = await sendTemplatedEmail({
      to: TEST_EMAIL,
      templateCode: code,
      variables: vars,
    });
    console.log(result.sent ? `  ✓ ${code}` : `  ✗ ${code}: ${result.error}`);
  }

  console.log(`\nDone! Check ${TEST_EMAIL} for preview emails.`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
