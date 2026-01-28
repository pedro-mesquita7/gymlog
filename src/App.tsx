import { useDuckDB } from './hooks/useDuckDB';
import { useExercises } from './hooks/useExercises';
import { useGyms } from './hooks/useGyms';
import { ExerciseList } from './components/ExerciseList';
import { GymList } from './components/GymList';

function App() {
  const { status, eventCount, refreshEventCount } = useDuckDB();

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

  // Loading state
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Gym<span className="text-accent">Log</span>
          </h1>
          <div className="flex items-baseline gap-3">
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

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
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
      </main>
    </div>
  );
}

export default App;
