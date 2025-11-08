import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<Props> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        await api.register(username, email, password);
        const response = await api.login(email, password);
        onLogin(response.user);
      } else {
        const response = await api.login(email, password);
        onLogin(response.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '30px', color: '#333', textAlign: 'center' }}>
          Security at Scale
        </h1>
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            {isRegister ? 'Register' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#667eea',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </form>
      </div>
    </div>
  );
};
