interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  ariaLabel?: string;
}

export default function Tabs({ tabs, activeTab, onTabChange, ariaLabel = 'Tabs' }: TabsProps) {
  return (
    <div className="mb-4 border-b border-accent-200">
      <nav className="-mb-px flex gap-1" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-accent-600 text-accent-600'
                : 'border-transparent text-accent-600 hover:border-accent-300 hover:text-accent-700'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? 'bg-accent-100 text-accent-700' : 'bg-accent-100/70 text-accent-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
