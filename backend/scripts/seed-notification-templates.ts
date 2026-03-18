#!/usr/bin/env tsx
/**
 * Seed notification templates into MongoDB. Run: npx tsx scripts/seed-notification-templates.ts
 * Requires MONGODB_URI in env or .env
 *
 * Email templates follow BRAND-GUIDELINES.md: brand-600 #4f46e5, brand-800 #3730a3, accent-500 #f59e0b
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { NotificationTemplate } from '../src/lib/models/NotificationTemplate';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';

// Shared email header - logo, gradient bar, brand identity
const EMAIL_HEADER = `
<div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%); padding: 24px 32px; text-align: center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td align="center">
        <img src="{{logoUrl}}" alt="LearnBuddy" width="56" height="56" style="display: block; border-radius: 12px;" />
        <h1 style="margin: 12px 0 4px 0; font-family: 'Outfit', 'DM Sans', -apple-system, sans-serif; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">LearnBuddy</h1>
        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">Learn with fun.</p>
      </td>
    </tr>
  </table>
</div>
`;

// Shared email footer - links, contact, copyright
const EMAIL_FOOTER = `
<div style="background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
  <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
    <a href="{{appUrl}}" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Open LearnBuddy</a>
    &nbsp;•&nbsp;
    <a href="{{appUrl}}/contact" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Contact Us</a>
  </p>
  <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
    Mon–Sat, 9 AM – 6 PM IST &nbsp;|&nbsp; support@learnbuddy.com
  </p>
  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
    © {{year}} LearnBuddy. Every child deserves a learning buddy.
  </p>
</div>
`;

const TEMPLATES = [
  // ═══════════════════════════════════════════════════════════════
  // SMS - Concise, friendly, DND-compliant
  // ═══════════════════════════════════════════════════════════════
  {
    channel: 'sms',
    code: 'login_otp',
    name: 'Login OTP',
    description: 'OTP sent when parent/teacher logs in with phone',
    isActive: true,
    body: "Hey! Your LearnBuddy login code is {{otp}}. It's valid for 5 min. Don't share it with anyone! 🎓",
    approvedWordings: [
      'Your OTP is {{otp}}. Valid for 5 minutes.',
      '{{otp}} is your verification code. Do not share.',
      'Use {{otp}} to sign in. Expires in 5 min.',
    ],
    variableHints: ['{{otp}}'],
  },
  {
    channel: 'sms',
    code: 'registration_otp',
    name: 'Registration OTP',
    description: 'OTP for parent/teacher registration',
    isActive: true,
    body: "Welcome to LearnBuddy! 🎉 Your verification code is {{otp}}. Valid for 5 min. Let's get you started!",
    approvedWordings: [
      'Your OTP is {{otp}}. Valid for 5 minutes.',
      '{{otp}} is your verification code for registration.',
    ],
    variableHints: ['{{otp}}'],
  },
  {
    channel: 'sms',
    code: 'delete_account_otp',
    name: 'Account Deletion OTP',
    description: 'OTP to confirm account deletion request',
    isActive: true,
    body: "Your LearnBuddy account deletion code is {{otp}}. Valid for 5 min. If you didn't request this, please ignore.",
    approvedWordings: [
      'Your OTP is {{otp}}. Valid for 5 minutes.',
      '{{otp}} is your verification code for account deletion.',
    ],
    variableHints: ['{{otp}}'],
  },

  // ═══════════════════════════════════════════════════════════════
  // EMAIL - Brand-aligned, gradient, card layout, fun copy
  // ═══════════════════════════════════════════════════════════════
  {
    channel: 'email',
    code: 'contact_form_confirmation',
    name: 'Contact Form Confirmation',
    description: 'Auto-reply when user submits contact form',
    isActive: true,
    subject: "We got your message, {{name}}! 🙌",
    logoUrl: 'https://learnbuddy.com/logo.svg',
    headerHtml: EMAIL_HEADER,
    bodyHtml: `
<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="padding: 40px 32px;">
    <div style="background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; border: 1px solid #e0e7ff;">
      <p style="margin: 0 0 16px 0; font-size: 18px; color: #3730a3; font-weight: 600;">Hi {{name}}! 👋</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #475569;">
        Thanks for reaching out—we're so glad you did! Your message about <strong>{{subject}}</strong> has landed safely in our inbox.
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #475569;">
        Our team typically responds within <strong>24–48 hours</strong>. We'll get back to you soon—promise! ✨
      </p>
    </div>
    <p style="margin: 0; font-size: 15px; color: #64748b;">
      Cheers,<br/>
      <strong style="color: #4f46e5;">The LearnBuddy Team</strong>
    </p>
  </div>
</div>
`,
    footerHtml: EMAIL_FOOTER,
    variableHints: ['{{name}}', '{{subject}}', '{{logoUrl}}', '{{appUrl}}', '{{year}}'],
  },
  {
    channel: 'email',
    code: 'class_reminder_15min',
    name: 'Class Reminder (15 min)',
    description: 'Sent 15 minutes before class',
    isActive: true,
    subject: "⏰ {{subject}} class in 15 minutes—let's go!",
    logoUrl: 'https://learnbuddy.com/logo.svg',
    headerHtml: EMAIL_HEADER,
    bodyHtml: `
<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="padding: 40px 32px;">
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; border: 1px solid #fde68a; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 48px;">📚</p>
      <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #92400e;">Class starting soon!</h2>
      <p style="margin: 0 0 20px 0; font-size: 18px; color: #78350f;">
        Your <strong>{{subject}}</strong> class begins at <strong>{{timeStr}}</strong>
      </p>
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #a16207;">
        Grab your notebook, find a quiet spot, and get ready to learn! 🚀
      </p>
      <a href="{{ctaUrl}}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
        Join Class →
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #94a3b8;">
      See you in class! — LearnBuddy
    </p>
  </div>
</div>
`,
    footerHtml: EMAIL_FOOTER,
    variableHints: ['{{subject}}', '{{timeStr}}', '{{ctaUrl}}', '{{logoUrl}}', '{{appUrl}}', '{{year}}'],
  },
  {
    channel: 'email',
    code: 'payment_reminder',
    name: 'Payment Reminder',
    description: 'Enrollment ending in 7 days',
    isActive: true,
    subject: "📅 Quick heads-up: {{studentName}}'s tuition renews soon",
    logoUrl: 'https://learnbuddy.com/logo.svg',
    headerHtml: EMAIL_HEADER,
    bodyHtml: `
<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="padding: 40px 32px;">
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; border: 1px solid #a7f3d0;">
      <p style="margin: 0 0 8px 0; font-size: 40px;">🌟</p>
      <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #065f46;">
        Keep the learning going!
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #047857;">
        {{studentName}}'s <strong>{{subject}}</strong> classes are going great—and the current enrollment is ending soon.
      </p>
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #059669;">
        Renew now to avoid any gap. One tap and you're all set! 💪
      </p>
      <a href="{{ctaUrl}}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
        Renew Now →
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #94a3b8;">
      Questions? Reply to this email—we're here to help!
    </p>
  </div>
</div>
`,
    footerHtml: EMAIL_FOOTER,
    variableHints: ['{{studentName}}', '{{subject}}', '{{ctaUrl}}', '{{logoUrl}}', '{{appUrl}}', '{{year}}'],
  },
  {
    channel: 'email',
    code: 'welcome_parent',
    name: 'Welcome Email (Parent)',
    description: 'Sent after parent registration completes',
    isActive: true,
    subject: "Welcome to LearnBuddy, {{name}}! 🎉",
    logoUrl: 'https://learnbuddy.com/logo.svg',
    headerHtml: EMAIL_HEADER,
    bodyHtml: `
<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="padding: 40px 32px;">
    <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; border: 1px solid #c7d2fe;">
      <p style="margin: 0 0 8px 0; font-size: 48px; text-align: center;">🎓</p>
      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #3730a3; text-align: center;">
        You're in! Welcome to LearnBuddy
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #475569;">
        Hi {{name}}, we're thrilled to have you! You've just joined thousands of parents who trust LearnBuddy for their child's learning journey.
      </p>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #475569;">
        <strong>What's next?</strong> Add your child's profile, browse expert teachers, and book your first class. It's that simple! ✨
      </p>
      <a href="{{ctaUrl}}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
        Get Started →
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
      Questions? Hit reply—we love hearing from you!
    </p>
  </div>
</div>
`,
    footerHtml: EMAIL_FOOTER,
    variableHints: ['{{name}}', '{{ctaUrl}}', '{{logoUrl}}', '{{appUrl}}', '{{year}}'],
  },
  {
    channel: 'email',
    code: 'welcome_teacher',
    name: 'Welcome Email (Teacher)',
    description: 'Sent after teacher registration completes',
    isActive: true,
    subject: "Welcome to the LearnBuddy family, {{name}}! 🌟",
    logoUrl: 'https://learnbuddy.com/logo.svg',
    headerHtml: EMAIL_HEADER,
    bodyHtml: `
<div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="padding: 40px 32px;">
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; border: 1px solid #fcd34d;">
      <p style="margin: 0 0 8px 0; font-size: 48px; text-align: center;">👩‍🏫</p>
      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #92400e; text-align: center;">
        You're officially a LearnBuddy teacher!
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #78350f;">
        Hi {{name}}, congratulations! You've joined our community of expert educators who are shaping young minds—one class at a time.
      </p>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #78350f;">
        Set up your batches, add your availability, and start connecting with students. Let's make learning fun together! 🚀
      </p>
      <a href="{{ctaUrl}}" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);">
        Complete Your Profile →
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
      Need help? Our support team is just an email away.
    </p>
  </div>
</div>
`,
    footerHtml: EMAIL_FOOTER,
    variableHints: ['{{name}}', '{{ctaUrl}}', '{{logoUrl}}', '{{appUrl}}', '{{year}}'],
  },

  // ═══════════════════════════════════════════════════════════════
  // IN-APP - Friendly, concise, action-oriented
  // ═══════════════════════════════════════════════════════════════
  {
    channel: 'in_app',
    code: 'class_reminder_15min',
    name: 'Class Reminder (15 min)',
    description: 'In-app notification 15 min before class',
    isActive: true,
    title: 'Class starting soon! 📚',
    message: 'Your {{subject}} class begins at {{timeStr}}. Grab your notebook and get ready to learn!',
    ctaLabel: 'Join Class',
    ctaUrl: '/student/classes',
    variableHints: ['{{subject}}', '{{timeStr}}'],
  },
  {
    channel: 'in_app',
    code: 'batch_start_reminder',
    name: 'Batch Start Reminder',
    description: 'Teacher: batch starts tomorrow',
    isActive: true,
    title: 'Batch starts tomorrow! 🎯',
    message: 'Your {{subject}} batch ({{batchName}}) kicks off tomorrow. Excited to meet your students!',
    ctaLabel: 'View Batches',
    ctaUrl: '/teacher/batches',
    variableHints: ['{{subject}}', '{{batchName}}'],
  },
  {
    channel: 'in_app',
    code: 'payment_reminder',
    name: 'Payment Reminder',
    description: 'Parent: enrollment ending soon',
    isActive: true,
    title: 'Renewal reminder 🌟',
    message: "{{studentName}}'s {{subject}} enrollment is ending soon. Renew now to keep the learning going!",
    ctaLabel: 'Renew Now',
    ctaUrl: '/parent/dashboard',
    variableHints: ['{{studentName}}', '{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'ai_content_generated',
    name: 'AI Content Generated',
    description: 'Student generated study material',
    isActive: true,
    title: 'Study material ready! ✨',
    message: '{{studentName}} just created AI study material for {{topic}} in {{subject}}. Take a look!',
    ctaLabel: 'View',
    ctaUrl: '/parent/students',
    variableHints: ['{{studentName}}', '{{topic}}', '{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'reschedule_request',
    name: 'Reschedule Request',
    description: 'Someone requested class reschedule',
    isActive: true,
    title: 'Reschedule request 📅',
    message: 'Someone wants to reschedule your {{subject}} class. Tap to confirm or suggest another time.',
    ctaLabel: 'View Request',
    ctaUrl: '/parent/classes',
    variableHints: ['{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'reschedule_confirmed',
    name: 'Reschedule Confirmed',
    description: 'Reschedule was accepted',
    isActive: true,
    title: 'Reschedule confirmed! ✅',
    message: 'Your {{subject}} class has been moved. Check the new time and we\'ll see you there!',
    ctaLabel: 'View Class',
    ctaUrl: '/parent/classes',
    variableHints: ['{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'reschedule_rejected',
    name: 'Reschedule Rejected',
    description: 'Reschedule was declined',
    isActive: true,
    title: 'Reschedule declined',
    message: 'Your {{subject}} class reschedule request wasn\'t accepted. You can still try another slot!',
    ctaLabel: 'View Classes',
    ctaUrl: '/parent/classes',
    variableHints: ['{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'course_purchased',
    name: 'New Student Enrolled',
    description: 'Teacher: new student joined batch',
    isActive: true,
    title: 'New student enrolled! 🎉',
    message: '{{studentName}} just joined your {{subject}} batch. Welcome them aboard!',
    ctaLabel: 'View Classes',
    ctaUrl: '/teacher/classes',
    variableHints: ['{{studentName}}', '{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'exam_completed',
    name: 'Exam Result Ready',
    description: 'Exam evaluated, result available',
    isActive: true,
    title: 'Exam result ready! 📊',
    message: '{{studentName}} scored {{score}}/{{totalMarks}} in {{subject}}. Great progress!',
    ctaLabel: 'View Results',
    ctaUrl: '/parent/performances',
    variableHints: ['{{studentName}}', '{{score}}', '{{totalMarks}}', '{{subject}}'],
  },
  {
    channel: 'in_app',
    code: 'ai_review_requested',
    name: 'AI Review Requested',
    description: 'Admin: user requested human review',
    isActive: true,
    title: 'New AI Review Request',
    message: 'A {{role}} has requested human review for {{entityType}}. Please review when you can.',
    ctaLabel: 'Review',
    ctaUrl: '/ai-review-requests',
    variableHints: ['{{role}}', '{{entityType}}'],
  },
  {
    channel: 'in_app',
    code: 'ai_review_resolved',
    name: 'AI Review Resolved',
    description: 'User: admin resolved review request',
    isActive: true,
    title: 'AI Review Completed ✅',
    message: 'Your review request has been reviewed. {{resolutionMessage}}',
    ctaLabel: 'View Details',
    ctaUrl: '/parent/review-requests',
    variableHints: ['{{resolutionMessage}}'],
  },
  {
    channel: 'in_app',
    code: 'doubt_answered',
    name: 'Doubt Answered',
    description: 'Student asked a doubt and got AI answer',
    isActive: true,
    title: 'Doubt answered! 💡',
    message: '{{studentName}} asked a doubt in {{subject}} and got an instant AI answer. Curious what they learned?',
    ctaLabel: 'View',
    ctaUrl: '/parent/students',
    variableHints: ['{{studentName}}', '{{subject}}'],
  },
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Seeding notification templates...');

  for (const t of TEMPLATES) {
    await NotificationTemplate.findOneAndUpdate(
      { channel: t.channel, code: t.code },
      { $set: t },
      { upsert: true }
    );
    console.log(`  ✓ ${t.channel}/${t.code}`);
  }

  console.log(`Seeded ${TEMPLATES.length} notification templates successfully.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
