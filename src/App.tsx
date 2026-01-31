import { useState, useEffect, lazy, Suspense } from 'react';
import { useDuckDB } from './hooks/useDuckDB';
import { useExercises } from './hooks/useExercises';
import { useGyms } from './hooks/useGyms';
import { useTemplates } from './hooks/useTemplates';
import { useWorkoutStore, selectIsWorkoutActive } from './stores/useWorkoutStore';
import { useBackupStore, selectShouldShowReminder } from './stores/useBackupStore';
import { ExerciseList } from './components/ExerciseList';
import { GymList } from './components/GymList';
import { TemplateList } from './components/templates/TemplateList';
import { StartWorkout } from './components/workout/StartWorkout';
import { ActiveWorkout } from './components/workout/ActiveWorkout';
import { BackupReminder } from './components/backup/BackupReminder';
import { BackupSettings } from './components/backup/BackupSettings';
import { Navigation, type Tab } from './components/Navigation';
import { FeatureErrorBoundary } from './components/ui/FeatureErrorBoundary';
import type { DatabaseStatus } from './types/database';

// Lazy load Analytics page to keep Recharts out of main bundle
const AnalyticsPage = lazy(() => import('./components/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));

function AppContent({ status, eventCount, refreshEventCount }: {
  status: DatabaseStatus;
  eventCount: number;
  refreshEventCount: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('workouts');

  const {
    exercises,
    isLoading: exercisesLoading,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useExercises();

  const {
    gyms,
    isLoading: gymsLoading,
    createGym,
    updateGym,
    deleteGym,
  } = useGyms();

  const { templates, isLoading: templatesLoading, refresh: refreshTemplates } = useTemplates();

  const isWorkoutActive = useWorkoutStore(selectIsWorkoutActive);
  const session = useWorkoutStore(state => state.session);
  const cancelWorkout = useWorkoutStore(state => state.cancelWorkout);
  const shouldShowReminder = useBackupStore(selectShouldShowReminder);

  // Refresh templates when switching to workouts tab (templates may have been
  // created/modified on the templates tab which uses its own hook instance)
  useEffect(() => {
    if (activeTab === 'workouts') {
      refreshTemplates();
    }
  }, [activeTab, refreshTemplates]);

  const handleCreateExercise = async (data: Parameters<typeof createExercise>[0]) => {
    await createExercise(data);
    refreshEventCount();
  };

  const handleUpdateExercise = async (id: string, data: Parameters<typeof updateExercise>[1]) => {
    await updateExercise(id, data);
    refreshEventCount();
  };

  const handleDeleteExercise = async (id: string) => {
    await deleteExercise(id);
    refreshEventCount();
  };

  const handleCreateGym = async (data: Parameters<typeof createGym>[0]) => {
    await createGym(data);
    refreshEventCount();
  };

  const handleUpdateGym = async (id: string, data: Parameters<typeof updateGym>[1]) => {
    await updateGym(id, data);
    refreshEventCount();
  };

  const handleDeleteGym = async (id: string) => {
    await deleteGym(id);
    refreshEventCount();
  };

  // Render Workouts tab content
  const renderWorkoutsContent = () => {
    // If workout is active, show active workout view
    if (isWorkoutActive && session) {
      // Wait for templates to load before deciding if template is missing
      if (templatesLoading) {
        return (
          <div className="text-center py-12 text-zinc-500">Loading workout...</div>
        );
      }

      const currentTemplate = templates.find(t => t.template_id === session.template_id);

      if (!currentTemplate) {
        // Template data lost (e.g. in-memory DB after reload) or deleted
        return (
          <div className="text-center py-12 space-y-4">
            <p className="text-red-400">Template not found. Session data may have been lost.</p>
            <button
              onClick={() => cancelWorkout()}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        );
      }

      return (
        <ActiveWorkout
          template={currentTemplate}
          exercises={exercises}
          onFinish={() => {
            refreshEventCount();
          }}
          onCancel={() => {
            // Session already cleared by cancelWorkout action
          }}
        />
      );
    }

    // No active workout - show start workout and management views
    return (
      <div className="space-y-12">
        {/* Start Workout section */}
        <StartWorkout
          templates={templates}
          gyms={gyms}
          onStarted={() => {
            // Session is already set by startWorkout action
            // Component will re-render showing ActiveWorkout
          }}
        />

        {/* Gym and exercise management */}
        <GymList
          gyms={gyms}
          isLoading={gymsLoading}
          onCreateGym={handleCreateGym}
          onUpdateGym={handleUpdateGym}
          onDeleteGym={handleDeleteGym}
        />

        <ExerciseList
          exercises={exercises}
          isLoading={exercisesLoading}
          onCreateExercise={handleCreateExercise}
          onUpdateExercise={handleUpdateExercise}
          onDeleteExercise={handleDeleteExercise}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Gym<span className="text-accent">Log</span>
          </h1>
          <div className="flex items-baseline gap-3">
            {isWorkoutActive && (
              <span className="text-xs text-accent font-medium animate-pulse">
                WORKOUT ACTIVE
              </span>
            )}
            {eventCount > 0 && (
              <span className="text-xs text-zinc-500 font-mono">
                {eventCount} events
              </span>
            )}
            {!status.isPersistent && (
              <span className="text-xs text-zinc-500 font-mono">demo mode</span>
            )}
          </div>
        </div>
      </header>

      {/* Demo mode warning */}
      {!status.isPersistent && status.isConnected && (
        <div className="bg-amber-900/30 border-b border-amber-700/50">
          <div className="max-w-2xl mx-auto px-6 py-2 text-center text-sm text-amber-200">
            Demo mode: Data will be lost on refresh. For persistence, run outside Docker.
          </div>
        </div>
      )}

      {/* Backup reminder - only in persistent mode */}
      {status.isPersistent && shouldShowReminder && <BackupReminder />}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {activeTab === 'settings' ? (
          <FeatureErrorBoundary feature="Settings">
            <BackupSettings />
          </FeatureErrorBoundary>
        ) : activeTab === 'analytics' ? (
          <FeatureErrorBoundary feature="Analytics">
            <Suspense fallback={<div className="text-center py-12 text-zinc-500">Loading analytics...</div>}>
              <AnalyticsPage />
            </Suspense>
          </FeatureErrorBoundary>
        ) : activeTab === 'workouts' ? (
          <FeatureErrorBoundary feature="Workouts">
            {renderWorkoutsContent()}
          </FeatureErrorBoundary>
        ) : (
          <FeatureErrorBoundary feature="Templates">
            <TemplateList />
          </FeatureErrorBoundary>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function App() {
  const { status, eventCount, refreshEventCount } = useDuckDB();

  // Loading state - wait for DB before mounting data hooks
  if (!status.isConnected && !status.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Error state
  if (status.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm">
          <p className="text-red-500 font-mono text-sm mb-4">{status.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // DB is connected - mount content with data hooks
  return (
    <AppContent
      status={status}
      eventCount={eventCount}
      refreshEventCount={refreshEventCount}
    />
  );
}

export default App;
