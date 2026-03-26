# AI Fairness & Bias Mitigation

This document outlines GuruChakra's approach to AI fairness, bias mitigation, and audit processes—especially for children's data under DPDP Act 2023.

---

## Overview

GuruChakra uses AI for:

- **Exam generation** — Student and teacher qualification exams
- **Exam evaluation** — Grading student answers (MCQ, short answer, drawing)
- **Study material generation** — Topic summaries, flashcards
- **Classroom & exam monitoring** — Video frame analysis for attendance and behavior
- **Doubt answering** — Student Q&A assistance
- **Document verification** — Teacher ID/photo verification

All AI usage involving children must be fair, transparent, and auditable.

---

## Bias Mitigation

### Design Principles

1. **No sensitive attributes in AI inputs** — Caste, religion, region, gender, or other protected attributes are not passed to AI models for grading or evaluation.
2. **Age-appropriate feedback** — AI-generated feedback for students is encouraging, constructive, and non-discriminatory.
3. **Consistent evaluation criteria** — Exam grading uses explicit rubrics (marks per question, correct/incorrect logic) rather than subjective judgments.
4. **Transparent scoring** — Per-question feedback explains what was correct or incorrect.

### Implementation Measures

| Area | Mitigation |
|------|------------|
| Exam evaluation | Rubric-based scoring; per-question feedback; no demographic inputs |
| Study material | Topic-only inputs; no student identity in prompts |
| Monitoring | Frame analysis only; no demographic inference |
| Doubt answering | Question-only context; no student profile in prompt |

### Children-Specific Safeguards

- Parent must consent to `ai_monitoring` before child's first monitored class/exam.
- AI monitoring consent is captured in `ConsentLog` with `consentType: 'ai_monitoring'`.
- Feedback tone is tuned for students (encouraging, constructive).
- No targeted or personalized content based on sensitive attributes.

---

## Audit Process

### AI Usage Logging

Every AI invocation is logged in `AIUsageLog`:

| Field | Purpose |
|-------|---------|
| `operationType` | e.g. `evaluate_student_exam`, `analyze_classroom_frame` |
| `userId` | User who triggered the operation |
| `source` | `ai_service` or `local_gemini` |
| `entityId` | Related entity (exam, class, etc.) |
| `inputMetadata` | Sanitized summary (no PII, no media) |
| `outputMetadata` | Summary of output (e.g. score range) |
| `durationMs`, `success`, `errorMessage` | Operational metrics |

**Admin API:** `GET /api/admin/ai-usage-logs` — filter by operation type, success, date range.

### Bias Audits (Periodic)

Recommended quarterly process:

1. **Score distribution analysis** — Compare exam scores across batches/teachers to detect anomalous patterns.
2. **Review request analysis** — If `AIReviewRequest` volume is high for certain question types or demographics, investigate.
3. **Feedback quality review** — Sample AI-generated feedback for tone and appropriateness.
4. **Model version tracking** — Log model version in `AIUsageLog` for reproducibility.

### Human Review

- Users can request human review via `POST /api/ai-review` for AI-graded exams and AI-generated content.
- `AIReviewRequest` model tracks: `raisedBy`, `entityType`, `entityId`, `remark`, `status`, `adminReply`, `correctedScore`.
- Admin resolves via `/api/admin/ai-review-requests/:id`.
- Notifications: `ai_review_requested` (to admins), `ai_review_resolved` (to user).

---

## Explainability

### Exam Evaluation

- Each question receives `feedback` explaining correct/incorrect and correct answer when wrong.
- Overall feedback includes `good` (what went well), `bad` (areas to improve), and `overall` (summary).
- Evaluation criteria are documented in prompts (e.g. partial credit rules for short answers).

### Monitoring

- Monitoring analyzes video frames for presence, attention, and anomalies.
- Alerts describe the detected issue (e.g. "multiple persons detected") without opaque scores.

---

## Document Updates

When AI models, prompts, or evaluation logic change:

1. Update this document with any new bias considerations.
2. Log model version in `AIUsageLog` if applicable.
3. Run a bias audit after significant changes.
4. Update DPDP-COMPLIANCE.md if new AI features affect children's data.

---

## Related Documentation

- [DPDP-COMPLIANCE.md](./DPDP-COMPLIANCE.md) — AI transparency, consent, human review
- [SECURITY.md](./SECURITY.md) — Data handling, incident response
