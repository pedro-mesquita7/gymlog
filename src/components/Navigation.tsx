type Tab = 'workouts' | 'templates' | 'analytics' | 'settings';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-2xl mx-auto flex">
        <button
          onClick={() => onTabChange('workouts')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'workouts'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Workouts
        </button>
        <button
          onClick={() => onTabChange('templates')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-accent border-t-2 border-accent -mt-px'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Settings
        </button>
      </div>
    </nav>
  );
}

export type { Tab };
