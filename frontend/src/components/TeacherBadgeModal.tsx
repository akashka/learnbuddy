import { Modal } from '@/components/Modal';

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface TeacherBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  badges: BadgeItem[];
}

export function TeacherBadgeModal({ isOpen, onClose, teacherName, badges }: TeacherBadgeModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-4">
          <h2 id="badge-modal-title" className="text-lg font-bold text-white">
            Badges & Verifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/90 transition hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-sm text-gray-600">
            Verified credentials for <strong className="text-brand-800">{teacherName}</strong>
          </p>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-500">No badges yet.</p>
          ) : (
            <ul className="space-y-4">
              {badges.map((badge) => (
                <li
                  key={badge.id}
                  className="flex items-start gap-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-2xl">
                    {badge.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-brand-800">{badge.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{badge.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="shrink-0 border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            <span className="btn-text">Close</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
