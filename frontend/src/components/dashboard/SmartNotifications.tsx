import { Link } from 'react-router-dom';

interface Notification {
  type: string;
  title: string;
  message: string;
  href: string;
  priority?: 'high' | 'medium' | 'low' | string;
}

interface SmartNotificationsProps {
  notifications: Notification[];
}

export function SmartNotifications({ notifications }: SmartNotificationsProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-lg font-bold text-brand-800">
        <span>🔔</span> What&apos;s happening
      </h3>
      <div className="space-y-2">
        {notifications.map((n) => (
          <Link
            key={`${n.type}-${n.title}`}
            to={n.href}
            className={`block rounded-xl border-2 p-4 transition hover:shadow-md ${
              n.priority === 'high'
                ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
                : 'border-brand-200 bg-white hover:border-brand-300'
            }`}
          >
            <p className="font-semibold text-brand-800">{n.title}</p>
            <p className="text-sm text-brand-600">{n.message}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
