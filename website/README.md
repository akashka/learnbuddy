# LearnBuddy – Marketing Website

Modern, responsive marketing website for LearnBuddy. Separate from the main app (frontend).

## Features

- **Home:** Hero, stats, features, reviews, app download CTAs
- **For Parents / Students / Teachers:** Role-specific landing pages (CMS)
- **Features & How It Works:** Product overview (CMS)
- **Static pages:** About, Contact, FAQ, Privacy, Terms (all from CMS API)
- **App download:** Prominent Play Store & App Store CTAs
- **Responsive:** Mobile-first, works on all screen sizes
- **Theme:** LearnBuddy brand (indigo/violet), "Learn with fun!" tagline

## Setup

```bash
npm install
npm run dev
```

Runs at http://localhost:3009 (see `vite.config.ts`).

**Requires:** Backend API running (for CMS pages and `/api/website/landing`).

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_WEBSITE_URL` | Website base URL for sitemap & OG tags (e.g. https://www.learnbuddy.com) |
| `VITE_APP_URL` | Main app URL (e.g. https://app.learnbuddy.com) |
| `VITE_ADMIN_URL` | Admin URL |
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_PLAY_STORE_URL` | Google Play app link |
| `VITE_APP_STORE_URL` | App Store link |

## Build & Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

**SEO:** The build generates `sitemap.xml` and `robots.txt`. Set `VITE_WEBSITE_URL` to your production domain (e.g. `https://www.learnbuddy.com`) in `.env` before building so sitemap and Open Graph URLs are correct.
