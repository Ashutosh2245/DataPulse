import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatsTable from '../components/StatsTable';
import Charts from '../components/Charts';
import AiChat from '../components/AiChat';

const DatasetDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('charts'); // 'charts' | 'ai' | 'stats' | 'correlation' | 'report'

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/datasets/${id}/results`);
        setData(res.data);
        setError('');
      } catch (err) {
        const msg = err.response?.data?.error || 'Failed to load analysis results.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datapulse_eda_analysis_${id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!data || !data.summary || !data.summary.stats) return;
    const stats = data.summary.stats;
    const cols = Object.keys(stats);
    let csv = 'Column,Type,Count,Nulls,Mean,Median,Min,Max,Outliers\n';
    cols.forEach((col) => {
      const s = stats[col];
      csv += `"${col}","${s.type}",${s.count || 0},${s.nulls || 0},${s.mean !== undefined ? s.mean : ''},${s.median !== undefined ? s.median : ''},${s.min !== undefined ? s.min : ''},${s.max !== undefined ? s.max : ''},${s.outliers || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datapulse_summary_${id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>📊</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.5rem' }}>
          Loading Comprehensive EDA Results...
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Profiling distributions, correlations, outliers, and AI dataset knowledge...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem', color: '#ef4444' }}>
            Analysis Not Available
          </h2>
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>
          <Link to="/dashboard" className="btn btn-primary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { filename, analysis_time, summary, charts } = data;
  const meta = summary?.metadata || {};

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      
      {/* Top Header Actions (Hidden in Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
            <span>←</span> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc' }}>
              {filename}
            </h1>
            <span className="badge badge-completed" style={{ fontSize: '0.8rem' }}>
              ✓ Analysis Ready
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Analyzed: {new Date(analysis_time).toLocaleString()} • Engine: Python Pandas EDA
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={handlePrintPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📄 Save / Print PDF
          </button>
          <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📥 Export CSV
          </button>
          <button onClick={handleDownloadJSON} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            💾 Export JSON
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Observations</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc', marginTop: '0.25rem' }}>
            {summary?.total_rows?.toLocaleString() || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Records analyzed</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Columns / Dimensions</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc', marginTop: '0.25rem' }}>
            {summary?.columns?.length || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {summary?.numeric_columns?.length || 0} numeric, {summary?.categorical_columns?.length || 0} categorical
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Data Cells</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '0.25rem' }}>
            {summary?.total_nulls ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {summary?.total_nulls === 0 ? '100% complete data' : 'Cells requiring imputation'}
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cleanliness & Deduplication</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.25rem' }}>
            {meta?.duplicates_removed || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Duplicate rows resolved</span>
        </div>
      </div>

      {/* Tabs Navigation (Hidden in Print) */}
      <div className="tabs-container no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          📊 Interactive Charts (6 Types)
        </button>
        <button
          className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI Talk (Voice & Text)
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📋 Descriptive Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'correlation' ? 'active' : ''}`}
          onClick={() => setActiveTab('correlation')}
        >
          🔗 Pearson Correlation
        </button>
        <button
          className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          📄 Executive Report & PDF
        </button>
      </div>

      {/* TAB 1: INTERACTIVE CHARTS */}
      {activeTab === 'charts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
              📊 Interactive Exploratory Visualizations
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Select columns & inspect statistical insights below each chart
            </span>
          </div>
          <Charts charts={charts} summary={summary} />
        </div>
      )}

      {/* TAB 2: AI DATA TALK ASSISTANT */}
      {activeTab === 'ai' && (
        <div>
          <AiChat datasetId={id} filename={filename} />
        </div>
      )}

      {/* TAB 3: STATS TABLE */}
      {activeTab === 'stats' && (
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>
              📋 Comprehensive Statistical Profiling
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Detailed counts, missing values, central tendency, quartiles, and detected outliers per feature
            </p>
          </div>
          <StatsTable summary={summary} />
        </div>
      )}

      {/* TAB 4: CORRELATION MATRIX */}
      {activeTab === 'correlation' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>
              🔗 Pearson Correlation Matrix & Heatmap
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Linear association between numeric features (-1.0 to +1.0)
            </p>
          </div>

          {summary?.correlation && summary.correlation.columns && summary.correlation.columns.length >= 2 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    {summary.correlation.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.correlation.matrix.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{summary.correlation.columns[i]}</strong></td>
                      {row.map((val, j) => {
                        const bgIntensity = Math.abs(val);
                        const bgColor = val > 0
                          ? `rgba(59, 130, 246, ${bgIntensity * 0.45})`
                          : `rgba(239, 68, 68, ${bgIntensity * 0.45})`;
                        return (
                          <td key={j} style={{ backgroundColor: bgColor, textAlign: 'center', fontWeight: '600' }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>At least 2 numeric columns are required to generate a correlation matrix.</p>
          )}
        </div>
      )}

      {/* TAB 5: EXECUTIVE REPORT & PDF EXPORT */}
      {activeTab === 'report' && (
        <div className="card print-section" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc' }}>DATAPULSE EXECUTIVE EDA REPORT</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Dataset: <strong>{filename}</strong> | Report ID: #{id}</p>
            </div>
            <button onClick={handlePrintPDF} className="btn btn-primary no-print">
              🖨️ Save as PDF
            </button>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.5rem' }}>
              1. Executive Overview
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.7', color: '#cbd5e1' }}>
              The dataset <strong>{filename}</strong> was automatically cleaned and evaluated using automated exploratory data analysis. 
              The dataset contains <strong>{summary?.total_rows?.toLocaleString()}</strong> observations across <strong>{summary?.columns?.length}</strong> features 
              ({summary?.numeric_columns?.length} numeric metrics, {summary?.categorical_columns?.length} categorical dimensions).
              Data cleaning resolved {meta?.duplicates_removed || 0} duplicate entries and quantified null distributions.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.75rem' }}>
              2. Descriptive Statistics Summary
            </h3>
            <StatsTable summary={summary} />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', marginBottom: '1rem' }}>
              3. Exploratory Visualizations
            </h3>
            <Charts charts={charts} summary={summary} />
          </div>
        </div>
      )}

    </div>
  );
};

export default DatasetDetail;
