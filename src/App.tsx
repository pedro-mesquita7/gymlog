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

  // Refresh event count after any operation
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">GymLog</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Database Status Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Database Status</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {status.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status.isPersistent ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm text-gray-600">
                {status.isPersistent ? 'OPFS Persistent' : 'Memory Only'}
              </span>
            </div>

            <div>
              <span className="text-sm text-gray-600">
                Events: <span className="font-medium">{eventCount}</span>
              </span>
            </div>
          </div>

          {status.error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              Error: {status.error}
            </div>
          )}

          {!status.isPersistent && status.isConnected && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded text-sm">
              Running in memory-only mode. Data will not persist. Use Chrome/Edge for OPFS persistence.
            </div>
          )}
        </div>

        {/* Gym Management - placed first since exercises may reference gyms */}
        {status.isConnected && (
          <GymList
            gyms={gyms}
            exercises={exercises}
            isLoading={gymsLoading}
            onCreateGym={handleCreateGym}
            onUpdateGym={handleUpdateGym}
            onDeleteGym={handleDeleteGym}
          />
        )}

        {/* Exercise Management - receives gyms for gym-specific exercises */}
        {status.isConnected && (
          <ExerciseList
            exercises={exercises}
            gyms={gyms}
            isLoading={exercisesLoading}
            onCreateExercise={handleCreateExercise}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
          />
        )}
      </main>
    </div>
  );
}

export default App;
