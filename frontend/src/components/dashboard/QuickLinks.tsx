import { Link } from 'react-router-dom';

interface QuickLink {
  href: string;
  icon: string;
  label: string;
}

interface QuickLinksProps {
  links: QuickLink[];
}

export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {links.map((item, idx) => (
        <Link
          key={item.href}
          to={item.href}
          className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-brand-200/60 bg-gradient-to-br from-white to-brand-50/50 p-4 shadow-md transition-all duration-300 hover:scale-105 hover:border-brand-400 hover:shadow-xl"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-2xl transition group-hover:scale-110">
            {item.icon}
          </span>
          <span className="text-center text-sm font-semibold text-brand-800">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
