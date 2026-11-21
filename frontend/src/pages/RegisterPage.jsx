import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '3.5rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc' }}>
            Create an Account
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Start analyzing datasets with automated EDA & AI Talk
          </p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginBottom: '1.25rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Get Started Now ➔'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
