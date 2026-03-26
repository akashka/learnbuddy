/**
 * PageMeta - Sets document title, meta description, and Open Graph tags per page.
 * Uses native DOM updates for SEO (crawlers that execute JS will see these).
 */

import { useEffect } from 'react';
import { BRAND } from '@shared/brand';

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.guruchakra.com';
const DEFAULT_OG_IMAGE = `${WEBSITE_URL}/images/hero-learning.png`;

export interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

function setMetaTag(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

export function PageMeta({ title, description, path = '', image = DEFAULT_OG_IMAGE, noIndex }: PageMetaProps) {
  const fullTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`;
  const canonicalUrl = `${WEBSITE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const imageUrl = image.startsWith('http') ? image : `${WEBSITE_URL.replace(/\/$/, '')}${image.startsWith('/') ? image : `/${image}`}`;

  useEffect(() => {
    document.title = fullTitle;
    setCanonical(canonicalUrl);

    setMetaTag('description', description);
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:image', imageUrl, true);
    setMetaTag('og:site_name', BRAND.name, true);
    setMetaTag('og:locale', 'en_IN', true);

    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', imageUrl);

    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    return () => {
      // Reset to defaults on unmount (e.g. when navigating away)
      document.title = `${BRAND.name} - ${BRAND.tagline} | One-to-One Online Tuition`;
    };
  }, [fullTitle, description, canonicalUrl, imageUrl, noIndex]);

  return null;
}
