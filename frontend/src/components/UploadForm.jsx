import React, { useState } from 'react';
import api from '../services/api';

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
  const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

  const validateSelectedFile = (selectedFile) => {
    if (!selectedFile) return false;
    const name = selectedFile.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => name.endsWith(ext));

    if (!hasValidExt) {
      setError(`Unsupported format. Please select ${allowedExtensions.join(', ')}`);
      return false;
    }

    if (selectedFile.size > maxSizeBytes) {
      setError('File size exceeds the 25 MB platform limit.');
      return false;
    }

    setError('');
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateSelectedFile(selected)) {
        setFile(selected);
      } else {
        setFile(null);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateSelectedFile(selected)) {
        setFile(selected);
      } else {
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a dataset file.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/datasets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        },
      });

      setUploading(false);
      if (onUploadSuccess) {
        onUploadSuccess(response.data.dataset);
      }
    } catch (err) {
      setUploading(false);
      const msg = err.response?.data?.details || err.response?.data?.error || err.message || 'Dataset upload failed.';
      setError(msg);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '640px', margin: '0 auto 2.5rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.4rem' }}>🚀</span>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
          Upload Dataset for Instant EDA & AI Talk
        </h3>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Upload your tabular data (Excel, CSV, JSON). Our Python engine will compute full statistical profiles, 6 chart types, and train the AI talk assistant automatically.
      </p>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.08)' : '#111827',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            marginBottom: '1.5rem',
          }}
          onClick={() => document.getElementById('file-input-element').click()}
        >
          <input
            id="file-input-element"
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>📄</div>
          <p style={{ fontWeight: '600', color: '#f8fafc', fontSize: '1rem', marginBottom: '0.35rem' }}>
            {file ? file.name : 'Click to browse or drag and drop your file here'}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Supports CSV, Excel (.xlsx, .xls), JSON (Up to 25 MB)
          </p>
          {file && (
            <div style={{ marginTop: '0.75rem', display: 'inline-block', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600' }}>
              ✓ Selected: {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          )}
        </div>

        {uploading && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
              <span>Uploading & Processing via Pandas EDA...</span>
              <span style={{ fontWeight: '700', color: '#38bdf8' }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
                }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!file || uploading}
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
        >
          {uploading ? 'Analyzing Dataset...' : 'Start Automated EDA & Analytics ➔'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
