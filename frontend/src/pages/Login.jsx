import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setLoading(true);

    try {
      await login(user, pass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🧁</span>
          <h2>Bakery Inventory System</h2>
          <p>Sign in to access inventory, production & sales</p>
        </div>

        {error && <div className="alert-box error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login-section">
          <p className="quick-login-title">Quick Demo Login:</p>
          <div className="quick-login-buttons">
            <button
              type="button"
              className="btn-quick admin"
              onClick={() => handleQuickLogin('admin', 'admin123')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn-quick manager"
              onClick={() => handleQuickLogin('manager', 'manager123')}
            >
              Manager
            </button>
            <button
              type="button"
              className="btn-quick staff"
              onClick={() => handleQuickLogin('staff', 'staff123')}
            >
              Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
