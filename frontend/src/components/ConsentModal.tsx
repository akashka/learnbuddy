import { Modal } from '@/components/Modal';

const CHILD_DATA_COLLECTION = `
Child Data Collection Consent

By accepting this, you consent to GuruChakra collecting and processing the following data for your child:
- Name, date of birth, class, board, school name
- Photo and identity proof (if provided)
- Academic performance data (exams, class attendance)
- Usage data for service improvement

This data is used solely to provide tuition services, process enrollments, and ensure child safety during classes. We do not sell or share this data with third parties for marketing.

Data is stored securely and you may request access, correction, or deletion at any time. See our Privacy Policy for full details.
`.trim();

const AI_MONITORING = `
AI Monitoring Consent

By accepting this, you consent to GuruChakra using AI-powered monitoring during your child's live classes and exams. This includes:

- Video monitoring to verify the student's presence and attention
- Detection of inappropriate behavior (e.g., multiple persons, background noise)
- Audio analysis for safety and engagement
- Recording of sessions for quality assurance and dispute resolution

AI monitoring helps ensure a safe learning environment. Alerts may be shared with you and teachers when issues are detected. Recordings are stored securely and used only for the purposes stated above.

You may withdraw consent at any time by contacting us. Withdrawal may affect your child's ability to attend certain classes.
`.trim();

interface ConsentModalProps {
  type: 'child_data_collection' | 'ai_monitoring';
  isOpen: boolean;
  onClose: () => void;
}

const titles: Record<string, string> = {
  child_data_collection: 'Child data collection',
  ai_monitoring: 'AI monitoring',
};

export function ConsentModal({ type, isOpen, onClose }: ConsentModalProps) {
  const content = type === 'child_data_collection' ? CHILD_DATA_COLLECTION : AI_MONITORING;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex max-h-[min(88vh,720px)] w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-5 py-4 sm:px-6">
          <h3 className="pr-4 text-lg font-bold text-white">{titles[type]}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{content}</p>
        </div>
        <div className="shrink-0 border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            I understand
          </button>
        </div>
      </div>
    </Modal>
  );
}
