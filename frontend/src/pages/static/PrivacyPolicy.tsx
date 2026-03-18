import { CmsPageView } from '@/components/CmsPageView';

export default function PrivacyPolicy() {
  return (
    <CmsPageView
      slug="privacy-policy"
      links={[{ to: '/terms-conditions', label: 'Terms & Conditions' }]}
    />
  );
}
