#!/usr/bin/env node
/**
 * Generates sitemap.xml and robots.txt for the frontend app.
 * Uses VITE_APP_WEBSITE_URL or VITE_APP_URL from env.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let BASE_URL = process.env.VITE_APP_WEBSITE_URL || process.env.VITE_APP_URL || 'https://app.guruchakra.com';
for (const f of ['.env', '.env.local']) {
  const p = join(__dirname, '..', f);
  if (existsSync(p)) {
    const content = readFileSync(p, 'utf8');
    const m = content.match(/VITE_APP_WEBSITE_URL=(.+)/) || content.match(/VITE_APP_URL=(.+)/);
    if (m) {
      BASE_URL = m[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const base = BASE_URL.replace(/\/$/, '');

const paths = [
  '/', '/login', '/register', '/for-you', '/for-parents', '/for-students', '/for-teachers',
  '/features', '/how-it-works', '/about-us', '/contact-us', '/faq',
  '/privacy-policy', '/terms-conditions', '/refund-policy', '/course-ownership-rules',
  '/parent/register',
];

const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url>
    <loc>${base}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`;

const publicDir = join(__dirname, '..', 'public');
writeFileSync(join(publicDir, 'sitemap.xml'), xml, 'utf8');

const robotsTxt = `# GuruChakra App - robots.txt
User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
writeFileSync(join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

console.log(`Generated sitemap.xml and robots.txt (${paths.length} URLs, base: ${base})`);
