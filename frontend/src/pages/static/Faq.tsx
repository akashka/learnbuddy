import { CmsPageView } from '@/components/CmsPageView';

export default function Faq() {
  return (
    <CmsPageView
      slug="faq"
      links={[
        { to: '/about-us', label: 'About Us' },
        { to: '/contact-us', label: 'Contact Us' },
      ]}
    />
  );
}
