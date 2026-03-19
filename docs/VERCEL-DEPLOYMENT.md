# Deploy Website, Frontend, Admin & App on Vercel

This guide walks you through deploying the **website** (marketing), **frontend** (main web app), **admin** (admin dashboard), and **app** (Expo web) to Vercel.

## Prerequisites

- Code pushed to GitHub
- Backend and AI service already deployed on Render
- Vercel account ([vercel.com](https://vercel.com))

---

## Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository (`tuition-platform`)
4. You'll create **4 separate projects** from the same repo (one for each app)

---

## Step 2: Deploy Website (Marketing Site)

1. **Add New** → **Project** → Select `tuition-platform`
2. Configure:

| Field | Value |
|-------|-------|
| **Project Name** | `learnbuddy-website` |
| **Root Directory** | `website` |
| **Framework Preset** | Vite (auto-detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment Variables** → Add:

| Key | Value |
|-----|-------|
| `VITE_WEBSITE_URL` | `https://learnbuddy-website.vercel.app` (or your custom domain) |
| `VITE_APP_URL` | `https://learnbuddy-frontend.vercel.app` (frontend URL) |
| `VITE_ADMIN_URL` | `https://learnbuddy-admin.vercel.app` (admin URL, if deployed) |
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` |
| `VITE_PLAY_STORE_URL` | Your Play Store URL (or placeholder) |
| `VITE_APP_STORE_URL` | Your App Store URL (or placeholder) |

4. Click **Deploy**

---

## Step 3: Deploy Frontend (Main Web App)

1. **Add New** → **Project** → Select `tuition-platform`
2. Configure:

| Field | Value |
|-------|-------|
| **Project Name** | `learnbuddy-frontend` |
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment Variables** → Add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` |

4. Click **Deploy**

---

## Step 4: Deploy Admin (Admin Dashboard)

1. **Add New** → **Project** → Select `tuition-platform`
2. Configure:

| Field | Value |
|-------|-------|
| **Project Name** | `learnbuddy-admin` |
| **Root Directory** | `admin` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment Variables** → Add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` |

4. Click **Deploy**

> **Note:** The admin dashboard requires staff login. Ensure you have staff users seeded in your backend.

---

## Step 5: Deploy App (Expo Web)

1. **Add New** → **Project** → Select `tuition-platform` again
2. Configure:

| Field | Value |
|-------|-------|
| **Project Name** | `learnbuddy-app` |
| **Root Directory** | `app` |
| **Framework Preset** | Other (or leave blank) |
| **Build Command** | `npm install && npx expo export -p web` |
| **Output Directory** | `dist` |

3. **Environment Variables** → Add:

| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://your-backend.onrender.com` |

4. Click **Deploy**

---

## Step 6: Update CORS on Render Backend (Optional)

CORS is set to allow-all by default. If you later restrict origins, add your Vercel URLs to the backend's `CORS_ORIGIN` on Render:

```
https://learnbuddy-website.vercel.app,https://learnbuddy-frontend.vercel.app,https://learnbuddy-admin.vercel.app,https://learnbuddy-app.vercel.app
```

(Add custom domains too when you set them up.)

---

## Step 7: Update Cross-References (Optional)

After deployment, update env vars if you use custom domains:

- **Website**: `VITE_WEBSITE_URL`, `VITE_APP_URL`, `VITE_ADMIN_URL`
- **Frontend**: `VITE_APP_WEBSITE_URL` (for sitemap/OG tags)
- **Admin**: Links to website/frontend if needed

---

## Summary of URLs

| App | Default Vercel URL |
|-----|-------------------|
| Website | `https://learnbuddy-website.vercel.app` |
| Frontend | `https://learnbuddy-frontend.vercel.app` |
| Admin | `https://learnbuddy-admin.vercel.app` |
| App (Expo web) | `https://learnbuddy-app.vercel.app` |

---

## Custom Domains

1. In each Vercel project → **Settings** → **Domains**
2. Add your domain (e.g. `www.learnbuddy.com`, `app.learnbuddy.com`)
3. Follow DNS instructions (add CNAME or A record)
4. Vercel provisions SSL automatically

---

## Troubleshooting

### Build fails with "Cannot find module '@shared/brand'"
- Ensure **Root Directory** is set correctly (`website` or `frontend`)
- The `shared` folder is at repo root; `../shared` resolves from the project directory

### App build fails
- Ensure Node.js 18+ is used (Vercel default)
- Check that `npx expo export -p web` runs locally first

### 404 on page refresh (SPA routing)
- The `vercel.json` in each project includes rewrites for client-side routing
- If issues persist, verify `rewrites` in project settings
