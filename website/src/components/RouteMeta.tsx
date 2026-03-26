/**
 * RouteMeta - Automatically sets page meta based on current route.
 * Renders PageMeta with the right title/description for each path.
 */

import { useLocation } from 'react-router-dom';
import { PageMeta } from './PageMeta';
import { SEO_PAGES } from '@/lib/seo';

const DEFAULT_META = {
  title: 'GuruChakra - Learn with Fun!',
  description: 'One-to-one online tuition for kids with AI monitoring. Find qualified teachers, AI-powered learning, DPDP compliant.',
};

export function RouteMeta() {
  const { pathname } = useLocation();
  const page = SEO_PAGES.find((p) => p.path === pathname);
  const meta = page ?? { path: pathname, title: DEFAULT_META.title, description: DEFAULT_META.description };

  return (
    <PageMeta
      title={meta.title}
      description={meta.description}
      path={meta.path}
      noIndex={pathname === '/404' || pathname.startsWith('/404')}
    />
  );
}
