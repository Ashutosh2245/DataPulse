import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#0f172a',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.9rem 1.75rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Link to="/" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📊</span>
          <span>Data<span style={{ color: '#38bdf8' }}>Pulse</span></span>
        </Link>
        <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.22rem 0.65rem', borderRadius: '9999px', fontWeight: '600', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>✨</span>
          <span>Data to Insights Generator</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {token ? (
          <>
            <Link to="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>
              Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.9rem' }}>👤</span>
              <span style={{ color: '#f8fafc', fontSize: '0.825rem', fontWeight: '600' }}>
                {user?.name || user?.email}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
