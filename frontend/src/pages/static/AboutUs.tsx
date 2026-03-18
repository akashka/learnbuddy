import { CmsPageView } from '@/components/CmsPageView';

export default function AboutUs() {
  return (
    <CmsPageView
      slug="about-us"
      links={[
        { to: '/contact-us', label: 'Contact Us' },
        { to: '/faq', label: 'FAQ' },
      ]}
    />
  );
}
