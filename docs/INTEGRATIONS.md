# Third-Party Integrations

This document describes GuruChakra's integration points with external services: payment, SMS, email, and video providers.

---

## Current Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Payment | **Placeholder** | Checkout creates `PendingEnrollment`; payment completion is manual |
| SMS | **TODO** | OTP and delete-request OTP logged to console |
| Email | **TODO** | Verification link logged to console |
| Video | **External** | Classes use teacher-provided meeting links (Google Meet, Zoom, etc.) |

---

## Payment

### Current Flow

1. Parent completes checkout → `POST /api/parent/checkout`
2. Backend creates `PendingEnrollment` with `paymentStatus: 'pending'`
3. Response includes `paymentUrl` → redirects to `/parent/payment?pendingId=<id>`
4. Parent clicks "Complete Payment" → `POST /api/parent/payment/complete`
5. Backend converts `PendingEnrollment` to `Enrollment`

**Note:** No payment gateway is integrated. The "Complete Payment" button marks payment as done without charging a card.

### Recommended Providers (India)

| Provider | Notes |
|----------|-------|
| **Razorpay** | UPI, cards, netbanking; good India support |
| **Paytm** | UPI, wallet |
| **Stripe** | International cards; India via Stripe India |

### Integration Steps (Razorpay example)

1. Add `razorpay` npm package
2. Create order: `POST /api/parent/checkout` → call Razorpay Orders API, return `order_id` and `key_id`
3. Frontend: Use Razorpay checkout.js; on success, call `POST /api/parent/payment/complete` with `razorpay_order_id`, `razorpay_payment_id`
4. Backend: Verify signature, update `PendingEnrollment.paymentStatus = 'completed'`, set `paymentId`
5. Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

---

## SMS

### Current Flow

- **OTP (login/registration):** `POST /api/auth/send-otp` — OTP stored in DB; delivery is **not implemented** (no SMS sent)
- **Delete request OTP:** `POST /api/account/delete-request` — OTP logged to console; `TODO: Send OTP via SMS`

### Recommended Providers

| Provider | Notes |
|----------|-------|
| **Twilio** | Global; India via Twilio India |
| **MSG91** | India-focused, DLT compliant |
| **AWS SNS** | SMS via SNS |

### Integration Steps (Twilio example)

1. Add `twilio` npm package
2. Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
3. In `send-otp` and `delete-request` routes: call `twilioClient.messages.create()` with OTP body
4. Ensure DLT registration for India (provider-specific)

---

## Email

### Current Flow

- **Email verification:** `POST /api/auth/send-email-verification` — generates link, logs to console; `TODO: Integrate email service`
- **Notifications:** In-app only; no email notifications

### Recommended Providers

| Provider | Notes |
|----------|-------|
| **SendGrid** | Simple API, good deliverability |
| **AWS SES** | Cost-effective at scale |
| **Resend** | Developer-friendly |
| **Postmark** | Transactional focus |

### Integration Steps (SendGrid example)

1. Add `@sendgrid/mail` npm package
2. Env: `SENDGRID_API_KEY`, `EMAIL_FROM` (e.g. `noreply@guruchakra.com`)
3. In `send-email-verification`: use `sgMail.send()` with verification link
4. Optional: Add `API_URL` or `BACKEND_URL` for correct link domain

---

## Video (Live Classes)

### Current Flow

- **Live classes:** Teachers share meeting links (Google Meet, Zoom, etc.) — not managed by the platform
- **AI monitoring:** Clients capture video frames and send to `POST /v1/monitor/classroom` or `POST /v1/monitor/exam`
- **Demo video:** `Teacher.demoVideoUrl` — URL to external video (YouTube, Vimeo, etc.)

### Recommended Providers (Embedded Video)

If you want to host video calls within the app:

| Provider | Notes |
|----------|-------|
| **Daily.co** | WebRTC, easy embed, recording |
| **Agora** | Low latency, India presence |
| **Twilio Video** | WebRTC, global |
| **100ms** | India-focused, low latency |

### Integration Steps (Daily.co example)

1. Create Daily room via API when class starts
2. Store `roomUrl` in `ClassSession` or similar
3. Frontend: Embed Daily iframe or use Daily React components
4. Env: `DAILY_API_KEY`, `DAILY_API_SECRET`

---

## Environment Variables Summary

| Variable | Service | Purpose |
|----------|---------|---------|
| `RAZORPAY_KEY_ID` | Backend | Payment (when integrated) |
| `RAZORPAY_KEY_SECRET` | Backend | Payment (when integrated) |
| `TWILIO_ACCOUNT_SID` | Backend | SMS |
| `TWILIO_AUTH_TOKEN` | Backend | SMS |
| `TWILIO_PHONE_NUMBER` | Backend | SMS sender |
| `SENDGRID_API_KEY` | Backend | Email |
| `EMAIL_FROM` | Backend | Email sender |
| `API_URL` / `BACKEND_URL` | Backend | Base URL for links (email, etc.) |
| `DAILY_API_KEY` | Backend | Video (when integrated) |

---

## Related Documentation

- [COMPONENT-CONNECTIONS.md](./COMPONENT-CONNECTIONS.md) — env vars, API contracts
- [DATA-FLOW.md](./DATA-FLOW.md) — checkout and payment flow
