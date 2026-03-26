# Mailgun Setup Guide

LearnBuddy uses **Mailgun** for sending transactional emails (verification links, reminders, notifications, etc.).

## What You Need from Mailgun

### 1. Create a Mailgun Account
- Sign up at [mailgun.com](https://www.mailgun.com)
- Verify your email

### 2. Get Your API Key
1. Go to **Sending** → **Domain settings** (or **Sending** → **Domains**)
2. Click your domain (or add one)
3. Go to **API Keys** section
4. Copy your **Private API key** (starts with `key-`)

### 3. Get Your Domain
- **Sandbox (testing):** Mailgun gives you a sandbox domain like `sandboxXXXXXXXX.mailgun.org` — use this for development
- **Production:** Add and verify your own domain (e.g. `mg.learnbuddy.com`) via DNS records (SPF, DKIM) in the Mailgun dashboard

### 4. From Email
- Must be from your verified domain (e.g. `LearnBuddy <hello@mg.learnbuddy.com>`)
- For sandbox: only authorized recipients can receive (add test emails in Mailgun dashboard)

## Environment Variables

Add these to your `backend/.env`:

```env
# Mailgun (transactional email)
MAILGUN_API_KEY=key-your-private-api-key-here
MAILGUN_DOMAIN=sandboxXXX.mailgun.org
EMAIL_FROM=LearnBuddy <hello@your-domain.mailgun.org>
APP_URL=https://learnbuddy.com
```

### Optional
- **`MAILGUN_EU=true`** — Use EU region (api.eu.mailgun.net) if your account is in EU

## Verify Setup

1. Run the seed to ensure templates exist:
   ```bash
   cd backend && npm run seed-notification-templates
   ```
2. Start the backend and trigger an action (e.g. contact form, email verification)
3. Check Mailgun **Sending** → **Logs** for delivery status

## Admin: Managing Email Templates

Go to **Admin** → **Notification Templates** → **Email** tab to:
- View and edit all email templates
- Customize subject, body HTML, header, footer
- Activate/deactivate templates
- Use variable hints: `{{name}}`, `{{studentName}}`, `{{subject}}`, etc.
