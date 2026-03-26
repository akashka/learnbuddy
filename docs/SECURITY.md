# Security

Security model, authentication, and operational practices for the GuruChakra platform.

---

## Authentication

### JWT

- **Issuance:** After OTP verification or login. Stored client-side (localStorage / AsyncStorage).
- **Validation:** Backend validates signature with `JWT_SECRET`, checks expiry, and (when Redis is available) blacklist.
- **Logout:** Token is added to Redis blacklist. Subsequent requests with that token return 401.

### OTP

- **Storage:** MongoDB with TTL. Expires after configured time.
- **Rate limit:** 5 requests per minute per IP on auth endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/send-otp`).
- **Use:** Phone verification for registration and login.

### Role-Based Access

- **authMiddleware:** Extracts JWT, decodes, attaches `decoded` to request. Rejects if invalid or blacklisted.
- **Role checks:** Routes enforce role (e.g. parent, teacher, student, admin) before proceeding.
- **Resource ownership:** Routes verify the user owns the resource (e.g. parent can only access their children’s data).

---

## AI Service Auth

- **Backend → AI Service:** `X-API-Key` header. Must match `AI_SERVICE_API_KEY` on both sides.
- **Client → AI Service (monitoring):** Short-lived JWT from `POST /api/ai/monitor-token`. Backend validates user and session/exam access before issuing. AI service validates JWT with same `JWT_SECRET`.

---

## Rate Limiting

| Scope | Limit | Endpoints |
|-------|-------|-----------|
| Auth | 5 req/min per IP | `/api/auth/login`, `/api/auth/register`, `/api/auth/send-otp` |
| General | 500 req/15 min per IP (configurable via `RATE_LIMIT_MAX`) | All backend routes (except `/health`) |
| AI Service | 60 req/min per IP | All AI routes (except `/health`) |

---

## CORS

- **Backend:** `CORS_ORIGIN` lists allowed origins. Credentials allowed.
- **AI Service:** Same pattern. Must include backend and all client origins.
- **Production:** Set explicit origins. Avoid wildcards for credentialed requests.

---

## Secrets

| Secret | Used By | Purpose |
|-------|---------|---------|
| `JWT_SECRET` | Backend, AI Service | Sign/verify JWTs |
| `AI_SERVICE_API_KEY` | Backend, AI Service | Authenticate backend→AI calls |
| `GEMINI_API_KEY` | Backend (fallback), AI Service | Google Gemini API |
| `CRON_SECRET` | Backend | Optional: protect cron endpoints |

**Practices:**

- Use strong, random values in production.
- Never commit `.env` or secrets to version control.
- Rotate secrets periodically; coordinate `JWT_SECRET` and `AI_SERVICE_API_KEY` across services.

---

## Data Handling

- **Passwords:** Hashed with bcrypt before storage.
- **Sensitive fields:** Bank details, documents stored in MongoDB. Ensure DB access is restricted and encrypted at rest (e.g. MongoDB Atlas).
- **Logs:** Avoid logging tokens, passwords, or full request bodies. Use `requestId` for tracing.

---

## Cron Endpoints

`/api/cron/generate-schedules` and `/api/cron/notifications` are unauthenticated by default. In production:

- Use a reverse proxy or firewall to restrict access to known IPs.
- Or implement `CRON_SECRET` header validation in the route handlers.

---

## Circuit Breaker (AI)

When calling the AI service, the backend uses a circuit breaker:

- After N consecutive failures, further calls fail fast.
- After a cooldown, one call is attempted to check recovery.
- Configurable via `AI_CIRCUIT_BREAKER_THRESHOLD` and `AI_CIRCUIT_BREAKER_COOLDOWN_MS`.

---

---

## Data Breach Notification (DPDP Act 2023)

Under the Digital Personal Data Protection Act 2023 (India), data fiduciaries must notify the Data Protection Board and affected individuals when a personal data breach occurs. For breaches involving children's data, parents must be notified.

### Incident Response Process

1. **Detect & Contain**
   - Identify the breach (unauthorized access, data leak, system compromise).
   - Contain the incident to prevent further exposure.
   - Preserve evidence (logs, access records) for investigation.

2. **Assess**
   - Determine scope: what data was affected (names, emails, payment info, children's data)?
   - Estimate number of affected users.
   - If children's data was affected, flag for DPDP-specific notifications.

3. **Log Incident**
   - Use Admin → Security Incidents to report the incident.
   - Record: title, description, type, severity, `childrenDataAffected`, detected date, affected data types, approximate user count.
   - Track status: open → investigating → contained → resolved → reported.

4. **Notify Data Protection Board (India)**
   - When a personal data breach occurs, notify the Data Protection Board as per DPDP rules.
   - Board contact: [Data Protection Board of India](https://www.dpb.gov.in) (check official site for current process).
   - Update the incident record with `boardNotifiedAt` when notification is sent.

5. **Notify Affected Users**
   - Notify affected individuals (and parents, if children's data was breached) without undue delay.
   - Include: nature of breach, data affected, steps being taken, contact for queries.
   - Update the incident record with `usersNotifiedAt` when notifications are sent.

6. **Remediate**
   - Document actions taken (containment, patching, access revocation).
   - Update the incident record with `actionsTaken`.
   - Conduct post-incident review and improve controls.

### Security Incidents (Admin)

- **Location:** Admin → Security Incidents
- **Create:** Report new incidents with severity, type, and whether children's data was affected.
- **Update:** Mark Board notified, users notified, and add actions taken.
- **API:** `GET/POST /api/admin/security-incidents`, `GET/PATCH /api/admin/security-incidents/:id`

---

## Recommendations

1. **HTTPS:** Use TLS in production for all services.
2. **Headers:** Add security headers (e.g. HSTS, X-Content-Type-Options) at the reverse proxy or app level.
3. **MongoDB:** Use authentication, restrict network access, enable encryption at rest.
4. **Redis:** Use authentication (`REDIS_URL` with password) and restrict network access.
5. **Dependencies:** Run `npm audit` and address critical/high vulnerabilities.
6. **Monitoring:** Log auth failures, rate-limit hits, and 5xx errors for incident response.
