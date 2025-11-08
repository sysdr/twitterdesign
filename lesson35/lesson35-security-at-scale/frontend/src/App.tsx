import { useEffect, useState } from 'react';
import { api } from './services/api';
import { SecurityDashboard } from './components/SecurityDashboard';
import { LoginForm } from './components/LoginForm';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verify token is valid
      api.getThreatScore()
        .then(() => setLoading(false))
        .catch(() => {
          localStorage.removeItem('accessToken');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)' }}>
      {user ? (
        <SecurityDashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}
