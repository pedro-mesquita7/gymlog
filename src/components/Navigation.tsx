type Tab = 'workouts' | 'templates' | 'analytics' | 'settings';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary shadow-nav">
      <div className="max-w-2xl mx-auto flex">
        <button
          data-testid="nav-workouts"
          onClick={() => onTabChange('workouts')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'workouts'
              ? 'text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className={`inline-block px-4 py-1 rounded-xl transition-colors ${
            activeTab === 'workouts' ? 'bg-accent/15' : ''
          }`}>
            Workouts
          </span>
        </button>
        <button
          data-testid="nav-templates"
          onClick={() => onTabChange('templates')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className={`inline-block px-4 py-1 rounded-xl transition-colors ${
            activeTab === 'templates' ? 'bg-accent/15' : ''
          }`}>
            Templates
          </span>
        </button>
        <button
          data-testid="nav-analytics"
          onClick={() => onTabChange('analytics')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className={`inline-block px-4 py-1 rounded-xl transition-colors ${
            activeTab === 'analytics' ? 'bg-accent/15' : ''
          }`}>
            Analytics
          </span>
        </button>
        <button
          data-testid="nav-settings"
          onClick={() => onTabChange('settings')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className={`inline-block px-4 py-1 rounded-xl transition-colors ${
            activeTab === 'settings' ? 'bg-accent/15' : ''
          }`}>
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}

export type { Tab };
