# LearnBuddy Brand Guidelines

**Version 1.0** | Last updated: March 2025

This document defines the visual identity, design system, and usage rules for LearnBuddy across all touchpoints: website, web application, mobile app, and admin software. Adherence ensures a consistent, professional, and recognizable brand experience.

---

## Table of Contents

1. [Brand Overview](#1-brand-overview)
2. [Company](#2-company)
3. [Logo](#3-logo)
4. [Wordmark & Tagline](#4-wordmark--tagline)
5. [Color System](#5-color-system)
6. [Typography](#6-typography)
7. [Spacing & Sizing Scale](#7-spacing--sizing-scale)
8. [Iconography](#8-iconography)
9. [Platform-Specific Guidelines](#9-platform-specific-guidelines)
10. [Accessibility](#10-accessibility)
11. [Edge Cases & Don'ts](#11-edge-cases--donts)
12. [Asset Checklist](#12-asset-checklist)

---

## 1. Brand Overview

### Brand Essence

**LearnBuddy** is a one-to-one online tuition platform for children, combining qualified teachers with AI-powered monitoring. The brand conveys trust, warmth, learning, and fun.

### Brand Attributes

| Attribute | Expression |
|-----------|------------|
| Trustworthy | Clean, professional design; consistent use of primary blue |
| Warm | Soft gradients, approachable typography |
| Educational | Pencil + home symbolism; structured layouts |
| Fun | Accent color for CTAs; friendly micro-interactions |

### Tagline

**Learn with fun.**

- Always lowercase (except at sentence start)
- Used as supporting copy, never as the primary brand name
- Optional in lockups; required in marketing materials

---

## 2. Company

Use these statements consistently across the website, app, marketing materials, and legal pages. **Source of truth:** `backend/src/lib/brand.ts` and this document.

### Vision

> **Every child deserves a learning buddy—personalized, safe, and fun.**

Our vision is a world where quality education is accessible to every child, regardless of location or circumstance. We believe learning should feel like having a trusted buddy by your side: supportive, engaging, and tailored to how you learn best.

### Mission

> **To make quality education accessible through one-to-one tuition, AI-powered safety, and learning that feels like fun.**

We connect parents with qualified, verified teachers for personalized online tuition. AI monitoring keeps children safe, AI tools enhance learning, and our platform ensures transparency and trust at every step.

### Values

| Value | Description |
|-------|-------------|
| **Trust** | We verify every teacher, protect every child's data, and operate with full transparency. DPDP compliant, always. |
| **Quality** | Expert teachers, AI-enhanced learning, and rigorous standards. We never compromise on what children deserve. |
| **Accessibility** | Learn from anywhere—mobile, tablet, or laptop. One-to-one attention without the commute. |
| **Fun** | Learning should spark joy. Our tagline says it: *Learn with fun.* |
| **Innovation** | AI that helps, not replaces. We use technology to make teaching and learning better. |

### Company Description (Short)

**One sentence (elevator pitch):**

> LearnBuddy is a one-to-one online tuition platform for children, combining qualified teachers with AI-powered monitoring—safe, personalized, and fun.

**Two sentences (about page / meta):**

> LearnBuddy connects parents with qualified, verified teachers for personalized online tuition. Every class is AI-monitored for safety, and students can ask AI anytime for help—so learning is effective, engaging, and secure.

**Paragraph (full about):**

> LearnBuddy is a one-to-one online tuition platform for children, combining qualified teachers with AI-powered monitoring. We connect parents with verified educators for safe, personalized learning from home. Our AI monitors classes for safety, generates exams and study materials, and answers student doubts 24/7. We're DPDP compliant and built for trust—so parents can focus on their child's growth, not logistics.

### Key Differentiators

- **AI-monitored sessions** — Safety and quality in every class
- **One-to-one attention** — Personalized learning, not crowded batches
- **Ask AI anytime** — Instant help with doubts and study materials
- **DPDP compliant** — Your child's data is protected
- **Verified teachers** — Background checks and AI qualification exams

### Contact

| Channel | Value |
|--------|-------|
| **Email** | support@learnbuddy.com |
| **Hours** | Mon–Sat, 9 AM – 6 PM IST |
| **Response** | Typically within 24 hours |

---

## 3. Logo

### Logo Concept

The LearnBuddy logo is a **pencil edge and home combination** within a **blue outer circle** that serves as a shadow/depth effect. It is **not** a solid circular blue mark—the circle is a subtle shadow ring that frames the icon.

### Logo Anatomy

| Element | Description |
|---------|-------------|
| **Icon** | Pencil tip/edge merged with a house silhouette (roof + door). Represents learning (pencil) and home/safe learning environment. |
| **Outer circle** | Blue ring acting as shadow/depth. Soft gradient or opacity for depth. |
| **Inner mark** | Pencil-home combo in white or brand color on gradient background |

### Logo Specifications

| Spec | Value |
|------|-------|
| **Format** | SVG (primary), PNG @2x/@3x for raster fallbacks |
| **Minimum size (digital)** | 32px height (icon only); 80px height (full lockup) |
| **Minimum size (print)** | 15mm height |
| **Clear space** | Minimum clear space = height of "L" in LearnBuddy (or icon height if icon-only) |
| **Aspect ratio** | Icon: 1:1; Full lockup: flexible, maintain proportions |

### Logo Variants

| Variant | Use Case |
|---------|----------|
| **Primary (full color)** | Light backgrounds (white, surface, brand-50) |
| **Reversed (white)** | Dark backgrounds (brand-700, brand-800, brand-900) |
| **Monochrome (brand-800)** | Single-color print, grayscale contexts |
| **Icon only** | Favicons, app icons, small spaces (≥32px) |
| **Wordmark only** | When icon is impractical; use sparingly |

### Logo Usage Rules

- **Do:** Use provided logo files; maintain clear space; scale proportionally
- **Don't:** Rotate; add effects (drop shadow, glow); change colors; stretch; place on busy backgrounds without sufficient contrast

### Logo Clear Space

```
┌─────────────────────────────────────┐
│  [X] = clear space (min = icon H)   │
│                                     │
│     X   ┌─────────┐   X             │
│     X   │  LOGO   │   X             │
│     X   └─────────┘   X             │
│                                     │
└─────────────────────────────────────┘
```

### Logo Design Specification (for Designers)

The icon should combine:

1. **Pencil element:** Angled pencil tip or pencil edge (diagonal line suggesting a pencil) integrated into the composition
2. **Home element:** Roof + door silhouette (house shape) representing safe learning at home
3. **Outer circle:** Blue ring (brand-600 to brand-700 gradient) at ~20–30% opacity, acting as a soft shadow/depth effect—**not** a solid filled circle
4. **Inner mark:** Pencil-home combo in white or light fill on a subtle gradient (brand-500 → brand-600)

**Current asset location:** `website/public/logo.svg`, `frontend/public/logo.svg`, `admin/public/logo.svg`

---

## 4. Wordmark & Tagline

### Wordmark: LearnBuddy

- **Spelling:** Single word, no space: **LearnBuddy**
- **Capitalization:** Title case (L, B uppercase)
- **Color:** Same as current brand—**brand-800** (#3730a3) on light; **white** on dark
- **Font:** Outfit Bold (display) or DM Sans Bold (fallback)

### Tagline: Learn with fun.

- **Format:** Sentence case, period optional in UI
- **Color:** brand-600 for emphasis; gray-600 for secondary
- **Font:** DM Sans Medium, 1 step smaller than wordmark

### Lockup Examples

```
[Icon] LearnBuddy  Learn with fun.
```

- Icon + wordmark: standard header/footer
- Icon + wordmark + tagline: marketing, hero sections
- Wordmark only: legal footers, dense UI

---

## 4. Color System

### Primary (Brand)

The primary palette is indigo-to-violet, conveying trust and learning.

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| brand-50 | `#eef2ff` | 238, 242, 255 | Backgrounds, hover states |
| brand-100 | `#e0e7ff` | 224, 231, 255 | Borders, subtle fills |
| brand-200 | `#c7d2fe` | 199, 210, 254 | Disabled, light borders |
| brand-300 | `#a5b4fc` | 165, 180, 252 | Placeholder, light accents |
| brand-400 | `#818cf8` | 129, 140, 248 | Hover on primary buttons |
| brand-500 | `#6366f1` | 99, 102, 241 | Secondary buttons, badges |
| **brand-600** | **`#4f46e5`** | **79, 70, 229** | **Primary buttons, links, key CTAs** |
| brand-700 | `#4338ca` | 67, 56, 202 | Hover on primary, active states |
| brand-800 | `#3730a3` | 55, 48, 163 | Headings, wordmark |
| brand-900 | `#312e81` | 49, 46, 129 | Dark backgrounds |
| brand-950 | `#1e1b4b` | 30, 27, 75 | Darkest accents |

**Primary color (main):** brand-600  
**Primary dark:** brand-800 (headings, wordmark)

### Secondary (Accent)

Warm amber for CTAs, highlights, and positive actions.

| Token | Hex | Use |
|-------|-----|-----|
| accent-400 | `#fbbf24` | Hover on accent buttons |
| accent-500 | `#f59e0b` | Accent buttons, highlights |
| accent-600 | `#d97706` | Accent hover, active |

**Use sparingly:** 1–2 accent elements per screen; never compete with primary.

### Neutrals

| Token | Hex | Use |
|-------|-----|-----|
| surface | `#fafbff` | Page background (slight blue tint) |
| surface-elevated | `#ffffff` | Cards, modals, nav |
| gray-50–950 | Tailwind gray | Body text, borders, disabled |

### Semantic Colors

| Purpose | Color | Token |
|---------|-------|-------|
| Success | Green | green-600 `#16a34a` |
| Error | Red | red-600 `#dc2626` |
| Warning | Amber | accent-500 |
| Info | Brand | brand-600 |

### CSS Variables (Tailwind)

```css
@theme {
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-200: #c7d2fe;
  --color-brand-300: #a5b4fc;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;
  --color-brand-800: #3730a3;
  --color-brand-900: #312e81;
  --color-brand-950: #1e1b4b;
  --color-accent-400: #fbbf24;
  --color-accent-500: #f59e0b;
  --color-accent-600: #d97706;
  --color-surface: #fafbff;
  --color-surface-elevated: #ffffff;
}
```

---

## 5. Typography

### Font Families

| Role | Font | Fallback | Use |
|------|------|----------|-----|
| **Display** | Outfit | DM Sans, system-ui | Headings, wordmark |
| **Body** | DM Sans | system-ui, -apple-system, sans-serif | Body text, UI |
| **Monospace** | ui-monospace, monospace | — | Code, IDs |

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

### Type Scale

| Name | Size | Line Height | Weight | Use |
|------|------|-------------|--------|-----|
| **Display XL** | 48px / 3rem | 1.1 | 700 | Hero headlines |
| **Display L** | 36px / 2.25rem | 1.2 | 700 | Section titles |
| **Display M** | 30px / 1.875rem | 1.25 | 600 | Card titles |
| **Heading L** | 24px / 1.5rem | 1.3 | 600 | Page titles |
| **Heading M** | 20px / 1.25rem | 1.4 | 600 | Subsections |
| **Heading S** | 18px / 1.125rem | 1.4 | 600 | Card headers |
| **Body L** | 18px / 1.125rem | 1.6 | 400 | Lead paragraphs |
| **Body M** | 16px / 1rem | 1.5 | 400 | Default body |
| **Body S** | 14px / 0.875rem | 1.5 | 400 | Secondary text |
| **Caption** | 12px / 0.75rem | 1.4 | 400 | Labels, hints |
| **Overline** | 12px / 0.75rem | 1.4 | 600 | Category labels |

### Responsive Scaling

| Breakpoint | Display XL | Heading L | Body M |
|------------|------------|-----------|--------|
| Mobile (<640px) | 32px | 20px | 16px |
| Tablet (640–1024px) | 40px | 22px | 16px |
| Desktop (>1024px) | 48px | 24px | 16px |

### Font Weights

- **400** Regular — body text
- **500** Medium — emphasis, labels
- **600** Semibold — headings, buttons
- **700** Bold — display, wordmark

---

## 6. Spacing & Sizing Scale

### Spacing (Tailwind)

| Token | Value | Use |
|-------|-------|-----|
| 1 | 4px | Tight gaps |
| 2 | 8px | Inline spacing |
| 3 | 12px | Small padding |
| 4 | 16px | Default padding |
| 5 | 20px | Section gaps |
| 6 | 24px | Card padding |
| 8 | 32px | Large gaps |
| 10 | 40px | Section spacing |
| 12 | 48px | Major sections |
| 16 | 64px | Hero spacing |
| 24 | 96px | Page sections |

### Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 4px | Inputs, badges |
| DEFAULT | 8px | Buttons, cards |
| lg | 12px | Cards, modals |
| xl | 16px | Hero cards |
| 2xl | 24px | Feature blocks |
| 3xl | 24px | Large containers |

### Shadows

| Token | Use |
|-------|-----|
| shadow-sm | Cards, subtle elevation |
| shadow | Buttons, dropdowns |
| shadow-md | Modals, nav |
| shadow-lg | Hero CTAs |
| shadow-xl | Marketing blocks |

---

## 7. Iconography

- **Style:** Rounded, 24px default, 2px stroke
- **Library:** Lucide, Heroicons, or custom SVG
- **Color:** Inherit or brand-600 for interactive
- **Size:** 16px (inline), 20px (buttons), 24px (nav)

---

## 8. Platform-Specific Guidelines

### 8.1 Website (Marketing / Landing)

| Element | Guideline |
|---------|-----------|
| **Background** | surface (#fafbff) |
| **Header** | Sticky, surface-elevated, border-brand-100 |
| **Logo** | Icon 44–48px + wordmark + tagline (desktop) |
| **Primary CTA** | bg-brand-600, white text, rounded-xl |
| **Links** | text-brand-600 hover:text-brand-700 |
| **Footer** | White, border-brand-100 |
| **Hero** | Gradient brand-600 → brand-900 for CTA blocks |

### 8.2 Web Application (Frontend)

| Element | Guideline |
|---------|-----------|
| **Background** | surface or white |
| **Navbar** | White, border-indigo-200 (align with brand-200) |
| **Cards** | White, border-brand-200, rounded-xl |
| **Buttons** | Primary: bg-brand-600; Secondary: bg-brand-100 text-brand-700 |
| **Headings** | text-brand-800 |
| **Links** | text-brand-600 hover:underline |

**Migration note:** Replace `indigo-*` with `brand-*` tokens for consistency.

### 8.3 Mobile App (Expo / React Native)

| Element | Guideline |
|---------|-----------|
| **Theme** | Define `colors`, `spacing`, `typography` in theme file |
| **Primary** | #4f46e5 (brand-600) |
| **Background** | #fafbff (surface) or #ffffff |
| **Logo** | Icon 40–44px in header |
| **Touch targets** | Min 44pt height |
| **Status bar** | Light content on dark headers |

### 8.4 Admin Software

| Element | Guideline |
|---------|-----------|
| **Differentiator** | Use accent (amber) to distinguish from main product |
| **Background** | accent-50 (amber-50) |
| **Sidebar** | White, border-accent-200 |
| **Active state** | bg-accent-100, text-accent-800 |
| **Logo** | "LearnBuddy Admin" — Admin in smaller, accent color |
| **Purpose** | Clearly internal; avoid confusion with parent/student app |

---

## 9. Accessibility

### Contrast

- **Body text:** Min 4.5:1 on background
- **Large text (18px+):** Min 3:1
- **UI components:** Min 3:1

### Focus States

- Visible focus ring: 2px solid brand-500, 2px offset
- Never remove focus styles without equivalent keyboard affordance

### Color Independence

- Do not rely on color alone for meaning (use icons, labels)
- Error states: color + icon + message

### Motion

- Respect `prefers-reduced-motion` for animations

---

## 10. Edge Cases & Don'ts

### Logo Don'ts

- Do not use logo on busy backgrounds without contrast
- Do not add drop shadow, glow, or gradient overlay to logo
- Do not stretch or distort
- Do not use low-resolution assets below minimum size
- Do not recreate or approximate the logo manually

### Color Don'ts

- Do not use brand-600 on brand-700 (insufficient contrast)
- Do not use accent as primary brand color
- Do not introduce new colors that compete with primary/secondary

### Typography Don'ts

- Do not use more than two font families in one view
- Do not use Display for body text
- Do not use font size smaller than 12px for body

### Platform Edge Cases

| Scenario | Guideline |
|----------|-----------|
| **Dark mode** | Use brand-400 for primary, white for text; logo reversed |
| **Print** | Black + brand-800; avoid gradients |
| **Favicon** | Icon only, 32×32, simplified |
| **App icon** | Icon only, full color, no text |
| **Email** | Web-safe fonts; inline CSS; logo as linked image |
| **Social share** | 1200×630px image, logo + tagline |
| **Video** | Logo watermark: bottom-right, 10% opacity |

---

## 11. Asset Checklist

### Required Logo Files

| Asset | Format | Size |
|-------|--------|------|
| Logo full (light bg) | SVG, PNG | — |
| Logo full (dark bg) | SVG, PNG | — |
| Icon only | SVG, PNG | 32, 64, 128, 256, 512 |
| Favicon | ICO, PNG | 16, 32 |
| App icon | PNG | 1024×1024 |

### Design Tokens Export

- CSS variables (see Color System)
- Tailwind config (brand, accent, surface)
- React Native theme (colors, spacing, typography)

---

## Appendix: Quick Reference

| Item | Value |
|------|-------|
| **Brand name** | LearnBuddy |
| **Tagline** | Learn with fun. |
| **Primary** | #4f46e5 (brand-600) |
| **Primary dark** | #3730a3 (brand-800) |
| **Accent** | #f59e0b (accent-500) |
| **Display font** | Outfit |
| **Body font** | DM Sans |
| **Surface** | #fafbff |
| **Min logo height** | 32px (icon), 80px (lockup) |

---

*For questions or updates to these guidelines, contact the design/engineering team.*
