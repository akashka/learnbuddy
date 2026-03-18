import { CmsPageView } from '@/components/CmsPageView';

export default function RefundPolicy() {
  return (
    <CmsPageView
      slug="refund-policy"
      links={[
        { to: '/terms-conditions', label: 'Terms & Conditions' },
        { to: '/course-ownership-rules', label: 'Course Ownership Rules' },
      ]}
    />
  );
}
