import { useDuckDB } from './hooks/useDuckDB';

function App() {
  const { status, eventCount } = useDuckDB();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">GymLog</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Database Status Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Database Status</h2>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="col-span-2">
              <span className="text-sm text-gray-600">
                Events stored: <span className="font-medium">{eventCount}</span>
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
              Note: Running in memory-only mode. Data will not persist after page refresh.
              For full persistence, use Chrome or Edge.
            </div>
          )}
        </div>

        {/* Placeholder for feature components */}
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">
            Data layer ready. Exercise and Gym management coming next...
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
