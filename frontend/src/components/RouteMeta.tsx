/**
 * RouteMeta - Sets page meta based on current route.
 */

import { useLocation } from 'react-router-dom';
import { PageMeta } from './PageMeta';
import { SEO_PAGES } from '@/lib/seo';

const DEFAULT_META = {
  title: 'GuruChakra - Learn with Fun!',
  description: 'One-to-one online tuition for kids with AI monitoring. Find teachers, enroll, or teach.',
};

export function RouteMeta() {
  const { pathname } = useLocation();
  const page = SEO_PAGES.find((p) => p.path === pathname);
  const meta = page ?? { path: pathname, title: DEFAULT_META.title, description: DEFAULT_META.description };

  // noindex for protected/dashboard routes
  const noIndex = pathname.includes('/dashboard') || pathname.includes('/marketplace') ||
    pathname.includes('/students') || pathname.includes('/classes') || pathname.includes('/batches') ||
    pathname.includes('/exams') || pathname.includes('/courses') || pathname.includes('/profile') ||
    pathname.includes('/payment') || pathname.includes('/checkout') || pathname === '/verify-email';

  return (
    <PageMeta
      title={meta.title}
      description={meta.description}
      path={meta.path}
      noIndex={noIndex}
    />
  );
}
