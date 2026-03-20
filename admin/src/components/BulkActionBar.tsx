import { useState } from 'react';

export type BulkAction = {
  id: string;
  label: string;
  variant?: 'default' | 'danger' | 'success';
  /** If true, opens a confirmation modal before running */
  confirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  onExecute: (ids: string[]) => Promise<void>;
};

interface BulkActionBarProps {
  selectedIds: string[];
  entityLabel: string;
  actions: BulkAction[];
  onClear: () => void;
  disabled?: boolean;
}

export function BulkActionBar({
  selectedIds,
  entityLabel,
  actions,
  onClear,
  disabled = false,
}: BulkActionBarProps) {
  const selectedCount = selectedIds.length;
  const [executing, setExecuting] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  const handleAction = async (action: BulkAction) => {
    if (action.confirm) {
      setConfirmAction(action);
      return;
    }
    await runAction(action);
  };

  const runAction = async (action: BulkAction) => {
    setExecuting(action.id);
    try {
      await action.onExecute(selectedIds);
      onClear();
      setConfirmAction(null);
    } catch {
      // Error handling is typically in the parent/onExecute
    } finally {
      setExecuting(null);
    }
  };

  const variantClasses = {
    default: 'bg-accent-600 text-white hover:bg-accent-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  return (
    <>
      <div
        className="sticky top-0 z-40 flex items-center justify-between gap-4 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-accent-800">
            {selectedCount} {entityLabel} selected
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-accent-600 underline hover:text-accent-800"
          >
            Clear selection
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              disabled={disabled || executing !== null}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                variantClasses[action.variant ?? 'default']
              }`}
            >
              {executing === action.id ? 'Processing...' : action.label}
            </button>
          ))}
        </div>
      </div>

      {confirmAction && (
        <BulkConfirmModal
          title={confirmAction.confirmTitle ?? `Confirm ${confirmAction.label}`}
          message={confirmAction.confirmMessage ?? `Are you sure you want to ${confirmAction.label.toLowerCase()} ${selectedCount} ${entityLabel}?`}
          count={selectedCount}
          entityLabel={entityLabel}
          actionLabel={confirmAction.label}
          variant={confirmAction.variant}
          onConfirm={() => runAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
          loading={executing === confirmAction.id}
        />
      )}
    </>
  );
}

interface BulkConfirmModalProps {
  title: string;
  message: string;
  count: number;
  entityLabel: string;
  actionLabel: string;
  variant?: 'default' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function BulkConfirmModal({
  title,
  message,
  count,
  entityLabel,
  actionLabel,
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: BulkConfirmModalProps) {
  const variantStyles = {
    default: 'bg-accent-600 hover:bg-accent-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-confirm-title"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-accent-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="bulk-confirm-title" className="mb-2 text-lg font-semibold text-accent-800">
          {title}
        </h2>
        <p className="mb-4 text-sm text-accent-700">{message}</p>
        <p className="mb-6 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          <strong>{count}</strong> {entityLabel} will be affected.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${variantStyles[variant]}`}
          >
            {loading ? 'Processing...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
