import { Link, useLocation } from 'react-router-dom';

interface BackLinkProps {
  to: string;
  label?: string;
}

/**
 * Link that preserves the previous screen (with filters) when navigating from a list.
 * Pass state: { from: location.pathname + location.search } when navigating to detail.
 */
export default function BackLink({ to, label = 'Back' }: BackLinkProps) {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const href = from || to;
  return (
    <Link to={href} className="text-accent-600 hover:text-accent-800 hover:underline">
      ← {label}
    </Link>
  );
}
