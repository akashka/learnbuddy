/**
 * Empty state block with icon and CTA, matching Batches style.
 */
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-white p-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-3xl">
        {icon}
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
