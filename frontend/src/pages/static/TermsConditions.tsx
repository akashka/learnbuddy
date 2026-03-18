import { CmsPageView } from '@/components/CmsPageView';

export default function TermsConditions() {
  return (
    <CmsPageView
      slug="terms-conditions"
      links={[{ to: '/privacy-policy', label: 'Privacy Policy' }]}
    />
  );
}
