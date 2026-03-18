import { CmsPageView } from '@/components/CmsPageView';

export default function ContactUs() {
  return (
    <CmsPageView
      slug="contact-us"
      links={[
        { to: '/about-us', label: 'About Us' },
        { to: '/faq', label: 'FAQ' },
      ]}
    />
  );
}
