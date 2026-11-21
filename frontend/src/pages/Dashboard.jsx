import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import UploadForm from '../components/UploadForm';

const Dashboard = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/datasets');
      setDatasets(res.data.datasets || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch datasets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchDatasets();
  };

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Data Analytics Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Automated Exploratory Data Analysis, 6 Interactive Visualizations, and AI Natural Language Talk
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowUpload(!showUpload)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
        >
          <span>{showUpload ? '✖ Close Form' : '➕ Upload New Dataset'}</span>
        </button>
      </div>

      {showUpload && <UploadForm onUploadSuccess={handleUploadSuccess} />}

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Datasets List Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Your Datasets</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Select any dataset to launch visualizations and AI Q&A</p>
          </div>
          <button onClick={fetchDatasets} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🔄</span> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center', color: '#94a3b8' }}>
            <span className="spinner" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
            <p>Loading datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📁</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#f8fafc' }}>No datasets uploaded yet</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Upload your first Excel (.xlsx), CSV, or JSON file to generate instant charts, outlier detection, and AI voice dialogue.
            </p>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              Upload Dataset Now ➔
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dataset Name</th>
                  <th>Uploaded Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => (
                  <tr key={ds.id}>
                    <td><span style={{ color: '#64748b' }}>#{ds.id}</span></td>
                    <td><strong style={{ color: '#f8fafc' }}>{ds.filename}</strong></td>
                    <td style={{ color: '#94a3b8' }}>{new Date(ds.uploaded_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${ds.status}`}>
                        {ds.status === 'completed' ? '✓ Ready' : ds.status}
                      </span>
                    </td>
                    <td>
                      {ds.status === 'completed' ? (
                        <Link
                          to={`/datasets/${ds.id}`}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          Explore & AI Talk ➔
                        </Link>
                      ) : ds.status === 'processing' ? (
                        <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Analyzing...</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Processing Error</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
