# Testing Strategy

This document outlines the recommended testing approach for GuruChakra. Currently, no test framework is configured.

---

## Current State

- **Backend:** No automated tests
- **AI Service:** No automated tests
- **Frontend / Admin:** No automated tests
- **App:** No automated tests
- **E2E:** None

---

## Recommended Test Strategy

### 1. Backend (Unit + Integration)

**Framework:** Jest or Vitest

**Scope:**
- Route handlers (auth, parent, teacher, student, admin)
- Business logic (deleteAccount, enrollment flow, checkout)
- Models (validation, indexes)

**Example structure:**
```
backend/
├── src/
│   └── api/
│       └── auth/
│           └── login/
│               └── route.test.ts
└── jest.config.js
```

**Suggested tests:**
- `POST /api/auth/login` — valid credentials, invalid credentials
- `POST /api/auth/send-otp` — rate limiting, OTP creation
- `POST /api/parent/students/create` — DOB required, consent logging
- `POST /api/account/delete-request` — OTP generation, scope validation
- `GET /api/privacy/dashboard` — auth required, data summary

---

### 2. AI Service

**Framework:** Vitest

**Scope:**
- Evaluation logic (MCQ, short answer, drawing)
- Generation prompts (exam, study material)
- Sanitization (no PII in logs)

**Suggested tests:**
- `evaluateStudentExam` — correct/incorrect answers, partial credit
- `normalizeNumericAnswer` — edge cases
- Input/output validation for AI prompts

---

### 3. Frontend / Admin

**Framework:** Vitest + React Testing Library

**Scope:**
- Critical components (ConsentModal, Auth forms)
- API integration (mock fetch)
- Routing

**Example:**
```tsx
// ConsentModal.test.tsx
import { render, screen } from '@testing-library/react';
import { ConsentModal } from './ConsentModal';

test('shows AI monitoring consent content', () => {
  render(<ConsentModal type="ai_monitoring" isOpen={true} onClose={() => {}} />);
  expect(screen.getByText(/AI-powered monitoring/)).toBeInTheDocument();
});
```

---

### 4. End-to-End (E2E)

**Framework:** Playwright or Cypress

**Scope:**
- User flows: registration → login → parent → add child → checkout
- Teacher: registration → batches → classes
- Admin: login → manage teachers → AI review requests

**Config:**
- Test against local or staging backend
- Use test MongoDB/Redis
- Mock external services (email, SMS, payment) if needed

---

## Implementation Priority

| Phase | Items | Effort |
|-------|-------|--------|
| 1 | Backend: Vitest setup, auth routes | 1–2 days |
| 2 | Backend: parent/student routes, delete flow | 1–2 days |
| 3 | AI Service: evaluation unit tests | 1 day |
| 4 | Frontend: critical components (auth, consent) | 1–2 days |
| 5 | E2E: Playwright setup, core flows | 2–3 days |

---

## CI Integration

Add to GitHub Actions (or similar):

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports: [27017:27017]
      redis:
        image: redis:7
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: cd backend && npm ci && npm run test
      - run: cd ai-service && npm ci && npm run test
      - run: cd frontend && npm ci && npm run test
```

---

## Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) — dev workflow, conventions
