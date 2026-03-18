interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataState({ loading, error, onRetry, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
        <p className="mt-4 text-sm text-accent-600">Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
