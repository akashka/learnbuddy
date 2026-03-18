import { CmsPageView } from '@/components/CmsPageView';

export default function CourseOwnershipRules() {
  return (
    <CmsPageView
      slug="course-ownership-rules"
      links={[
        { to: '/terms-conditions', label: 'Terms & Conditions' },
        { to: '/refund-policy', label: 'Refund Policy' },
      ]}
    />
  );
}
