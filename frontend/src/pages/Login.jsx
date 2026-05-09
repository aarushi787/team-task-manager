import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5">
                <path d="M9 11l3 3L22 4"/><rect x="3" y="5" width="16" height="16" rx="2" strokeWidth="2"/>
              </svg>
            </div>
            <div className="logo-text">Task<span>Flow</span></div>
          </div>

          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your workspace</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="you@company.com" required autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control" type="password" name="password"
                value={form.password} onChange={handleChange}
                placeholder="••••••••" required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{marginTop: 8}}>
              {loading ? <span className="spinner" style={{borderColor:'rgba(0,0,0,0.2)',borderTopColor:'#1a1a2e'}} /> : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
