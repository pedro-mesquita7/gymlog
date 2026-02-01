import { useState, useEffect, lazy, Suspense } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { useDuckDB } from './hooks/useDuckDB';
import { useExercises } from './hooks/useExercises';
import { useGyms } from './hooks/useGyms';
import { usePlans } from './hooks/usePlans';
import { useWorkoutStore, selectIsWorkoutActive } from './stores/useWorkoutStore';
import { useBackupStore, selectShouldShowReminder } from './stores/useBackupStore';
import { ExerciseList } from './components/ExerciseList';
import { GymList } from './components/GymList';
import { PlanList } from './components/plans/PlanList';
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

  const { plans, isLoading: plansLoading, refresh: refreshPlans } = usePlans();

  const isWorkoutActive = useWorkoutStore(selectIsWorkoutActive);
  const session = useWorkoutStore(state => state.session);
  const cancelWorkout = useWorkoutStore(state => state.cancelWorkout);
  const shouldShowReminder = useBackupStore(selectShouldShowReminder);

  // Refresh plans when switching to workouts tab (plans may have been
  // created/modified on the plans tab which uses its own hook instance)
  useEffect(() => {
    if (activeTab === 'workouts') {
      refreshPlans();
    }
  }, [activeTab, refreshPlans]);

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
      // Wait for plans to load before deciding if plan is missing
      if (plansLoading) {
        return (
          <div className="text-center py-12 text-text-muted">Loading workout...</div>
        );
      }

      const currentPlan = plans.find(t => t.template_id === session.template_id);

      if (!currentPlan) {
        // Plan data lost (e.g. in-memory DB after reload) or deleted
        return (
          <div className="text-center py-12 space-y-4">
            <p className="text-error">Plan not found. Session data may have been lost.</p>
            <button
              onClick={() => cancelWorkout()}
              className="px-6 py-3 bg-bg-tertiary hover:bg-bg-elevated rounded-2xl transition-colors"
            >
              Dismiss
            </button>
          </div>
        );
      }

      return (
        <ActiveWorkout
          plan={currentPlan}
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
      <div className="space-y-8">
        {/* Start Workout section */}
        <StartWorkout
          plans={plans}
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

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animation configuration - respects prefers-reduced-motion
  const pageTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.15 }; // Default easing is good enough

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen pb-20">
        {/* Header */}
        <header className="border-b border-border-primary">
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
                <span className="text-xs text-text-muted font-mono">
                  {eventCount} events
                </span>
              )}
              {!status.isPersistent && (
                <span className="text-xs text-text-muted font-mono">demo mode</span>
              )}
            </div>
          </div>
        </header>

        {/* Demo mode warning */}
        {!status.isPersistent && status.isConnected && (
          <div className="bg-warning/10 border-b border-warning/30">
            <div className="max-w-2xl mx-auto px-6 py-2 text-center text-sm text-warning">
              Demo mode: Data will be lost on refresh. For persistence, run outside Docker.
            </div>
          </div>
        )}

        {/* Backup reminder - only in persistent mode */}
        {status.isPersistent && shouldShowReminder && <BackupReminder />}

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={pageTransition}
            >
              {activeTab === 'settings' ? (
                <FeatureErrorBoundary feature="Settings">
                  <BackupSettings />
                </FeatureErrorBoundary>
              ) : activeTab === 'analytics' ? (
                <FeatureErrorBoundary feature="Analytics">
                  <Suspense fallback={<div className="text-center py-12 text-text-muted">Loading analytics...</div>}>
                    <AnalyticsPage />
                  </Suspense>
                </FeatureErrorBoundary>
              ) : activeTab === 'workouts' ? (
                <FeatureErrorBoundary feature="Workouts">
                  {renderWorkoutsContent()}
                </FeatureErrorBoundary>
              ) : (
                <FeatureErrorBoundary feature="Plans">
                  <PlanList />
                </FeatureErrorBoundary>
              )}
            </m.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </LazyMotion>
  );
}

function App() {
  const { status, eventCount, refreshEventCount } = useDuckDB();

  // Loading state - wait for DB before mounting data hooks
  if (!status.isConnected && !status.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  // Error state
  if (status.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
        <div className="max-w-sm">
          <p className="text-error font-mono text-sm mb-4">{status.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
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
