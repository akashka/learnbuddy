# Data Flow

This document describes how data moves through the GuruChakra platform—from user actions to backend processing, AI calls, and storage.

---

## Request Flow (Standard)

Most user actions follow this path:

```
User → Frontend/Admin/App → Backend API → [Sentiment Pre-Screen] → AI Service (when needed)
                              ↓                    ↑
                         MongoDB              [Sentiment Post-Screen]
```

1. User interacts with the UI (click, form submit, navigation).
2. Client sends HTTP request to `VITE_API_BASE_URL` or `EXPO_PUBLIC_API_BASE_URL` (backend).
3. Backend validates JWT, applies business logic, reads/writes MongoDB.
4. **If user content (review, question, answer, transcript):** Sentiment layer screens input before processing. Reject if score &lt; 0.2; mask if 0.2–0.3.
5. If the operation needs AI, backend calls the AI service with `X-API-Key`.
6. **If AI output:** Sentiment layer screens response. Mask offending content; attach warning flags.
7. Backend returns response to client.

---

## Authentication Flow

### Login

1. User enters phone (and optionally email/password).
2. Client calls `POST /api/auth/send-otp` with phone.
3. Backend generates OTP, stores in MongoDB (TTL), sends via notification service.
4. User enters OTP.
5. Client calls `POST /api/auth/verify-otp` with phone and OTP.
6. Backend verifies OTP, creates or finds User, returns JWT.
7. Client stores JWT (localStorage / AsyncStorage) and uses it in `Authorization: Bearer <token>`.

### Registration

- **Parent:** Multi-step flow via `parent-registration` routes. OTP verification, profile data, children creation.
- **Teacher:** Multi-step flow via `teacher-registration` routes. OTP, profile, qualification exam (AI-generated), document verification. On success, Teacher and User are created.

### Logout

1. Client calls `POST /api/auth/logout`.
2. Backend adds current JWT to Redis blacklist.
3. Client clears stored token.

---

## Marketplace and Enrollment Flow

1. Parent browses `GET /api/teachers/marketplace` (filter by board, class, subject).
2. Parent views teacher `GET /api/teachers/:id`.
3. Parent adds to wishlist `POST /api/parent/wishlist` or goes to checkout.
4. Checkout: `POST /api/parent/checkout` creates `PendingEnrollment` with slots, duration, student.
5. Payment: client redirects to payment provider; on success, `POST /api/parent/payment/complete` converts `PendingEnrollment` to `Enrollment`.
6. Backend creates `ClassSession` records via schedule generation (cron or manual).

---

## Class Session Flow

1. **Schedule generation:** Cron job or `POST /api/admin/schedules/generate` runs `generate-class-schedules` logic. Reads `Enrollment` records, creates `ClassSession` for each slot.
2. **Start class:** Teacher/Student calls `POST /api/teacher/class/start` or `POST /api/student/class/start` with `sessionId`.
3. **During class:** Optional AI monitoring (see below).
4. **End class:** `POST /api/teacher/class/end` or `POST /api/student/class/end`.

### Reschedule

1. Parent or Teacher requests reschedule: `POST /api/classes/reschedule/request` with proposed slots.
2. Other party confirms: `POST /api/classes/reschedule/confirm` or rejects.
3. On confirm, backend creates new `ClassSession`, links via `rescheduledToSessionId`.

---

## Exam Flow

### Student Exam

1. Student selects topic(s), exam type (quick_test, class_test, preparatory).
2. Client calls `POST /api/student/exam/generate`.
3. Backend calls AI service `POST /v1/generate/student-exam` (or local fallback).
4. Backend creates `StudentExam` with questions, returns exam ID.
5. Student starts exam: `POST /api/student/exam/start`.
6. During exam: client captures webcam + microphone, sends frame + audio to `POST /api/student/exam/monitor` every ~20s. AI transcribes speech (speech-to-text) and analyzes for cheating. Transcripts stored in `monitoringTranscripts`.
7. Student submits: `POST /api/student/exam/submit` with answers.
8. Backend calls AI service `POST /v1/evaluate/exam` (or local).
9. Backend updates `StudentExam` with score, `aiFeedback`.

### Teacher Qualification Exam

1. During teacher registration, backend calls AI service `POST /v1/generate/teacher-qualification-exam`.
2. Teacher takes exam; backend evaluates locally (MCQ + short answers).
3. Pass/fail stored in `QualificationExam`.

---

## AI Integration Flow

### Backend → AI Service (Proxy)

When `AI_SERVICE_URL` and `AI_SERVICE_API_KEY` are set:

1. Backend uses `ai-client.ts` to call AI service.
2. Each call includes `X-API-Key: <AI_SERVICE_API_KEY>`.
3. Circuit breaker wraps calls: after repeated failures, backend fails fast instead of hanging.
4. Timeout: 60 seconds by default.

**Endpoints used:**

| Backend need | AI Service endpoint |
|--------------|---------------------|
| Qualification exam | `POST /v1/generate/qualification-exam` |
| Student exam | `POST /v1/generate/student-exam` |
| Teacher qualification | `POST /v1/generate/teacher-qualification-exam` |
| Study material | `POST /v1/generate/study-material` |
| Exam evaluation | `POST /v1/evaluate/exam` |
| Classroom frame | `POST /v1/monitor/classroom` |
| Exam frame (video+audio, STT) | `POST /v1/monitor/exam` |
| Speech-to-text | `POST /v1/monitor/transcribe` |
| Doubt | `POST /v1/doubt/ask` |
| Document verification | `POST /v1/monitor/verify-document` |
| Sentiment analysis | `POST /v1/sentiment/analyze`, `POST /v1/sentiment/batch` |

---

## Sentiment & Content Safety Flow

The sentiment layer screens content **before** and **after** AI:

| Content | Pre-AI (input) | Post-AI (output) |
|---------|----------------|-------------------|
| Parent reviews | Analyze review text; reject &lt; 0.2, mask 0.2–0.3 | — |
| Doubt questions | Reject if &lt; 0.2 | — |
| Doubt answers | — | Analyze; mask; return `answerWarning` |
| Exam text answers | — | Analyze; mask in `questionDetails`; set `lowSentimentWarning` |
| Transcripts | — | Analyze; store masked; return `transcriptWarning` |
| Study material | — | Analyze; mask before caching |
| Exam questions | — | Analyze; mask before delivery |

### Client → AI Service (Direct, for Monitoring)

For real-time classroom and exam monitoring, latency matters. Clients call the AI service directly with a short-lived JWT:

1. Client calls `POST /api/ai/monitor-token` with `{ type: 'classroom', sessionId }` or `{ type: 'exam', examId }`.
2. Backend validates user, checks session/exam access, issues JWT (2h expiry).
3. Client sends video frames to `POST /v1/monitor/classroom` or `POST /v1/monitor/exam` with `Authorization: Bearer <monitorToken>`.
4. AI service validates JWT (same `JWT_SECRET`), returns alert/no-alert.
5. Alerts can be stored as `AIAlert` in MongoDB.

---

## Study Material Flow

1. Student selects subject, topic, board, class.
2. Client calls `POST /api/study/generate` or `GET /api/study/topics`.
3. Backend checks `AIGeneratedContent` cache; if miss, calls AI service `POST /v1/generate/study-material`.
4. Backend caches result, returns to client.

---

## Doubt Flow

1. Student asks a question in context (subject, topic, board, class).
2. Client calls `POST /api/study/ask`.
3. **Sentiment pre-screen:** Backend/AI service analyzes question. Reject if score &lt; 0.2.
4. Backend calls AI service `POST /v1/doubt/ask`.
5. **Sentiment post-screen:** AI service analyzes answer. Mask if unsafe; set `answerWarning`.
6. Backend returns `{ answer, questionWarning?, answerWarning?, sentimentScore? }` to client.

---

## Notification Flow

1. BullMQ job runs every 15 minutes (or via cron trigger).
2. Job queries `Notification` and `ClassSession` for upcoming classes, etc.
3. Notification service sends (e.g. in-app, push, email—depending on implementation).
4. Client fetches `GET /api/notifications`, marks read via `POST /api/notifications/mark-read`.

---

## Job Queue Flow (BullMQ)

- **generate-schedules:** Runs hourly. Reads enrollments, generates `ClassSession` for next N days.
- **cron-notifications:** Runs every 15 min. Sends reminders, etc.

Jobs are processed by the backend worker. Redis is required.
