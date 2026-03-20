# API Reference

Overview of backend and AI service endpoints. All backend routes use base path `/api`. Auth-required routes need `Authorization: Bearer <jwt>`.

---

## Backend API

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with phone/email, password |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/send-otp` | No | Send OTP to phone |
| POST | `/api/auth/verify-otp` | No | Verify OTP, return JWT |
| GET | `/api/auth/verify-email` | No | Verify email via token (redirect) |
| POST | `/api/auth/send-email-verification` | Yes | Send email verification link |
| POST | `/api/auth/logout` | Yes | Blacklist token |

### Registration (OTP)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/registration/send-otp` | No | Send OTP |
| POST | `/api/registration/verify-otp` | No | Verify OTP |

### Parent Registration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/parent-registration/check-phone` | No | Check if phone exists |
| POST | `/api/parent-registration/save` | No | Save registration step |

### Teacher Registration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/teacher-registration/check-phone` | No | Check phone |
| POST | `/api/teacher-registration/save` | No | Save step |
| GET | `/api/teacher-registration/data` | No | Get registration data |
| GET | `/api/teacher-registration/verify-access` | No | Verify access token |
| GET | `/api/teacher-registration/exam` | No | Get qualification exam |
| POST | `/api/teacher-registration/exam` | No | Submit exam |
| GET | `/api/teacher-registration/exam/status` | No | Exam status |
| POST | `/api/teacher-registration/exam/monitor` | No | Exam monitoring |
| POST | `/api/teacher-registration/complete` | No | Complete registration |

### Teachers (Public / Shared)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/teachers/marketplace` | No | List teachers (filter: board, class, subject) |
| GET | `/api/teachers/:id` | No | Teacher profile |
| GET | `/api/teachers/qualification-exam` | Yes | Get qualification exam |
| POST | `/api/teachers/qualification-exam` | Yes | Submit qualification exam |

### Parent

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/parent/profile` | Yes | Get profile |
| PUT | `/api/parent/profile` | Yes | Update profile (name, email, location) |
| GET | `/api/parent/onboarding-status` | Yes | Onboarding checklist |
| GET | `/api/parent/students` | Yes | List children |
| POST | `/api/parent/students/create` | Yes | Add child (DOB required, consent required) |
| PUT | `/api/parent/students/update` | Yes | Update child (consent required) |
| POST | `/api/parent/students/change-password` | Yes | Change child password |
| POST | `/api/parent/student-details` | Yes | Get student details |
| GET | `/api/parent/wishlist` | Yes | List wishlist |
| POST | `/api/parent/wishlist` | Yes | Add to wishlist |
| DELETE | `/api/parent/wishlist` | Yes | Remove from wishlist |
| POST | `/api/parent/checkout` | Yes | Create checkout (PendingEnrollment) |
| POST | `/api/parent/payment/complete` | Yes | Payment success callback |
| POST | `/api/parent/payment/fail` | Yes | Payment failure callback |
| GET | `/api/parent/payments` | Yes | Payment history |
| GET | `/api/parent/classes` | Yes | Parent's classes |
| GET | `/api/parent/my-teachers` | Yes | Enrolled teachers |
| GET | `/api/parent/performances` | Yes | Student performances |
| GET | `/api/parent/pending-mappings` | Yes | Pending enrollment mappings |
| POST | `/api/parent/reviews` | Yes | Submit teacher review |

### Teacher

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/teacher/profile` | Yes | Get profile |
| PUT | `/api/teacher/profile` | Yes | Update profile |
| GET | `/api/teacher/batches` | Yes | List batches |
| POST | `/api/teacher/batches` | Yes | Create batch |
| GET | `/api/teacher/classes` | Yes | List classes |
| POST | `/api/teacher/class/start` | Yes | Start class |
| POST | `/api/teacher/class/end` | Yes | End class |
| GET | `/api/teacher/students` | Yes | List enrolled students |
| GET | `/api/teacher/exams` | Yes | List student exams |
| GET | `/api/teacher/payments` | Yes | Payment history |
| GET | `/api/teacher/onboarding-status` | Yes | Onboarding status |
| GET | `/api/teacher/agreements` | Yes | List agreements (commission, payment terms, conduct) with content and signed status |
| POST | `/api/teacher/agreements/sign` | Yes | Sign an agreement (body: `{ type: "commission_model" \| "payment_terms" \| "conduct_rules" }`) |

### Account (DPDP)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/account/delete-request` | Yes | Request account deletion (sends OTP) |
| POST | `/api/account/delete-confirm` | Yes | Confirm deletion with OTP |

### Privacy (Parent / Teacher)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/privacy/dashboard` | Yes | Data summary, consent history |
| GET | `/api/privacy/export` | Yes | Export personal data as JSON |

### Student

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/student/profile` | Yes | Get profile |
| GET | `/api/student/courses` | Yes | Enrolled courses |
| GET | `/api/student/classes` | Yes | List classes |
| POST | `/api/student/class/start` | Yes | Start class |
| POST | `/api/student/class/end` | Yes | End class |
| GET | `/api/student/exams` | Yes | List exams |
| GET | `/api/student/exam/:id` | Yes | Get exam by ID |
| GET | `/api/student/exam/eligibility` | Yes | Check exam eligibility |
| GET | `/api/student/exam/format` | Yes | Get exam format (questions, time, marks) |
| GET | `/api/student/exam/topics` | Yes | Get topics for exam |
| POST | `/api/student/exam/generate` | Yes | Generate exam (AI) |
| POST | `/api/student/exam/start` | Yes | Start exam |
| POST | `/api/student/exam/submit` | Yes | Submit exam |
| POST | `/api/student/exam/evaluate` | Yes | Evaluate (if not auto) |
| POST | `/api/student/exam/monitor` | Yes | Exam monitoring |
| POST | `/api/student/exam/recording` | Yes | Upload recording |
| GET | `/api/student/exam/recording/play` | Yes | Play recording |

### Study

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/study/topics` | Yes | List topics (board, class, subject) |
| GET | `/api/study/eligibility` | Yes | Check study eligibility |
| POST | `/api/study/generate` | Yes | Generate study material (AI, optional flashcards) |
| POST | `/api/study/generate-flashcards` | Yes | Generate flashcards from topic (Option A) |
| POST | `/api/study/generate-flashcards-from-material` | Yes | Extract flashcards from study material (Option C) |
| POST | `/api/study/generate-flashcards-from-exam` | Yes | Generate flashcards from exam weak areas (Option D) |
| POST | `/api/study/ask` | Yes | Ask doubt (AI) |

### Classes (Reschedule)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/classes/reschedule/request` | Yes | Request reschedule |
| GET | `/api/classes/reschedule/pending` | Yes | Pending reschedule requests |
| POST | `/api/classes/reschedule/confirm` | Yes | Confirm reschedule |
| POST | `/api/classes/reschedule/reject` | Yes | Reject reschedule |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| GET | `/api/notifications/unread-count` | Yes | Unread count |
| POST | `/api/notifications/mark-read` | Yes | Mark as read |

### AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/monitor-token` | Yes | Get short-lived JWT for AI monitoring |

### Classroom Monitor

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/classroom/monitor` | Yes | Submit frame for monitoring |

### Masters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/masters` | No | List masters (board, class, subject) |
| POST | `/api/masters` | Yes | Create master |
| PATCH | `/api/masters/:id` | Yes | Update master |

### Board-Class-Subjects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/board-class-subjects` | No | List board-class-subject mappings |

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/create` | Yes | Create payment |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/teachers` | Yes | List teachers |
| GET | `/api/admin/teachers/:id/detail` | Yes | Teacher detail |
| PATCH | `/api/admin/teachers/:id` | Yes | Update teacher |
| GET | `/api/admin/security-incidents` | Yes | List security incidents |
| POST | `/api/admin/security-incidents` | Yes | Create security incident |
| GET | `/api/admin/security-incidents/:id` | Yes | Get incident |
| PATCH | `/api/admin/security-incidents/:id` | Yes | Update incident (status, boardNotifiedAt, usersNotifiedAt) |
| GET | `/api/admin/parents` | Yes | List parents |
| GET | `/api/admin/parents/:id` | Yes | Parent detail |
| PATCH | `/api/admin/parents/:id` | Yes | Update parent |
| GET | `/api/admin/students` | Yes | List students |
| PATCH | `/api/admin/students/:id` | Yes | Update student |
| GET | `/api/admin/enrollments` | Yes | List enrollments |
| POST | `/api/admin/enrollments/manage` | Yes | Manage enrollment |
| GET | `/api/admin/classes` | Yes | List classes |
| GET | `/api/admin/masters` | Yes | List masters |
| POST | `/api/admin/masters/mappings` | Yes | Create mapping |
| PATCH | `/api/admin/masters/mappings/:id` | Yes | Update mapping |
| GET | `/api/admin/topics` | Yes | List topics |
| POST | `/api/admin/topics` | Yes | Create topic |
| PATCH | `/api/admin/topics/:id` | Yes | Update topic |
| DELETE | `/api/admin/topics/:id` | Yes | Delete topic |
| GET | `/api/admin/ai-data` | Yes | AI generated content |
| GET | `/api/admin/drafts` | Yes | List drafts |
| POST | `/api/admin/drafts/update` | Yes | Update draft |
| POST | `/api/admin/schedules/generate` | Yes | Trigger schedule generation |
| POST | `/api/admin/teacher-payments` | Yes | Process teacher payment |
| POST | `/api/admin/users/update` | Yes | Update user |

### Cron

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cron/generate-schedules` | No | Generate schedules (cron) |
| POST | `/api/cron/generate-schedules` | No | Generate schedules |
| GET | `/api/cron/notifications` | No | Run notification job |
| POST | `/api/cron/notifications` | No | Run notification job |

### CMS Pages (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cms-pages/:slug` | No | Get CMS page by slug (about-us, contact-us, faq, for-parents, for-students, for-teachers, features, how-it-works, privacy-policy, terms-conditions, etc.) |

### Website (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/website/landing` | No | Get landing page content (stats, reviews, features) for marketing website |

### Seed (Dev)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/seed-admin` | No | Create admin user |
| POST | `/api/seed-masters` | No | Seed masters |
| POST | `/api/seed-topics` | No | Seed topics |
| POST | `/api/seed-cms-pages` | No | Seed CMS pages (or run `npm run seed-cms-pages` in backend) |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check (MongoDB, Redis) |

---

## AI Service API

Base path: `/v1`. Auth: `X-API-Key` or `Authorization: Bearer <jwt>`.

### Generate

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/generate/qualification-exam` | Generate teacher qualification exam |
| POST | `/v1/generate/student-exam` | Generate student exam |
| POST | `/v1/generate/teacher-qualification-exam` | Generate teacher qualification (multi-combo) |
| POST | `/v1/generate/study-material` | Generate study material (optional includeFlashcards) |
| POST | `/v1/generate/flashcards` | Generate flashcards from topic |
| POST | `/v1/generate/flashcards-from-material` | Extract flashcards from study material text |
| POST | `/v1/generate/flashcards-from-exam` | Generate flashcards from exam feedback |

### Evaluate

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/evaluate/exam` | Evaluate exam (score, feedback) |

### Monitor

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/monitor/classroom` | Analyze classroom frame |
| POST | `/v1/monitor/exam` | Analyze exam frame (optional audio) |
| POST | `/v1/monitor/verify-document` | Verify document photo |

### Doubt

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/doubt/ask` | Answer doubt in context |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
