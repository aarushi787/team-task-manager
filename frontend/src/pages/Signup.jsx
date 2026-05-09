import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map(e => e.msg).join(', ') : err.response?.data?.message || 'Signup failed');
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

          <h2>Create account</h2>
          <p className="subtitle">Start managing your team's work</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-control" type="text" name="name"
                value={form.name} onChange={handleChange}
                placeholder="Alex Johnson" required autoFocus
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="you@company.com" required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control" type="password" name="password"
                value={form.password} onChange={handleChange}
                placeholder="Minimum 6 characters" required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select className="form-control" name="role" value={form.role} onChange={handleChange}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{marginTop: 8}}>
              {loading ? <span className="spinner" style={{borderColor:'rgba(0,0,0,0.2)',borderTopColor:'#1a1a2e'}} /> : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
