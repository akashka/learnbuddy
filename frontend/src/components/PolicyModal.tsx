import { Modal } from '@/components/Modal';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function PolicyModal({ isOpen, onClose, title, children }: PolicyModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-brand-100 px-6 py-4">
          <h2 id="policy-modal-title" className="text-xl font-bold text-brand-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-brand-50 hover:text-brand-700"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        <div className="shrink-0 border-t border-brand-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full"
          >
            <span className="btn-text">Close</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
