
const CHILD_DATA_COLLECTION = `
Child Data Collection Consent

By accepting this, you consent to LearnBuddy collecting and processing the following data for your child:
- Name, date of birth, class, board, school name
- Photo and identity proof (if provided)
- Academic performance data (exams, class attendance)
- Usage data for service improvement

This data is used solely to provide tuition services, process enrollments, and ensure child safety during classes. We do not sell or share this data with third parties for marketing.

Data is stored securely and you may request access, correction, or deletion at any time. See our Privacy Policy for full details.
`.trim();

const AI_MONITORING = `
AI Monitoring Consent

By accepting this, you consent to LearnBuddy using AI-powered monitoring during your child's live classes and exams. This includes:

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
  child_data_collection: 'Child Data Collection',
  ai_monitoring: 'AI Monitoring',
};

export function ConsentModal({ type, isOpen, onClose }: ConsentModalProps) {
  if (!isOpen) return null;

  const content = type === 'child_data_collection' ? CHILD_DATA_COLLECTION : AI_MONITORING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-brand-800">{titles[type]}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto whitespace-pre-wrap px-4 py-4 text-sm text-gray-700">
          {content}
        </div>
        <div className="border-t px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-brand-600 py-2 text-white hover:bg-brand-700"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
