import { CmsPageView } from '@/components/CmsPageView';

export default function SafetyAndTrust() {
  return (
    <CmsPageView
      slug="safety-and-trust"
      links={[
        { to: '/about-us', label: 'About Us' },
        { to: '/faq', label: 'FAQ' },
        { to: '/contact-us', label: 'Contact Us' },
      ]}
    />
  );
}
