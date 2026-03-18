import { useToast } from '@/contexts/ToastContext';

const typeStyles: Record<string, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-600 text-white',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto flex min-w-[280px] max-w-md items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${typeStyles[t.type]}`}
        >
          <span className="flex-1 text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="shrink-0 rounded p-1 opacity-80 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
