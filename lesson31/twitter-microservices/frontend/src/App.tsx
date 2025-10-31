import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ServiceMonitor } from './components/ServiceMonitor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Twitter Microservices Dashboard</h1>
        </header>
        
        <main className="container mx-auto mt-6 px-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/monitor" element={<ServiceMonitor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
