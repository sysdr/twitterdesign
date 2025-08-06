import Timeline from './components/Timeline';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-blue-600">Twitter Timeline System</h1>
            <div className="text-sm text-gray-500">Lesson 3: Timeline Generation</div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Timeline />
      </main>
    </div>
  );
}

export default App;
