type Tab = 'workouts' | 'templates' | 'analytics' | 'settings';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-border-primary">
      <div className="max-w-2xl mx-auto flex">
        <button
          data-testid="nav-workouts"
          onClick={() => onTabChange('workouts')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'workouts'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Workouts
        </button>
        <button
          data-testid="nav-templates"
          onClick={() => onTabChange('templates')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Templates
        </button>
        <button
          data-testid="nav-analytics"
          onClick={() => onTabChange('analytics')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Analytics
        </button>
        <button
          data-testid="nav-settings"
          onClick={() => onTabChange('settings')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Settings
        </button>
      </div>
    </nav>
  );
}

export type { Tab };
