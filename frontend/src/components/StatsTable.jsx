import React from 'react';

const StatsTable = ({ summary }) => {
  if (!summary || !summary.stats) {
    return <p style={{ color: '#94a3b8' }}>No summary statistics available.</p>;
  }

  const columns = summary.columns || Object.keys(summary.stats);

  return (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Data Type</th>
            <th>Total Count</th>
            <th>Missing (Nulls)</th>
            <th>Mean / Unique</th>
            <th>Median</th>
            <th>Min / Max Span</th>
            <th>Outliers / Top Class</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => {
            const stat = summary.stats[col];
            if (!stat) return null;

            const isNumeric = stat.type === 'numeric';

            return (
              <tr key={col}>
                <td>
                  <strong style={{ color: '#f8fafc' }}>{col}</strong>
                </td>
                <td>
                  <span className={`badge ${isNumeric ? 'badge-processing' : 'badge-pending'}`}>
                    {stat.type}
                  </span>
                </td>
                <td>{stat.count?.toLocaleString()}</td>
                <td>
                  <span style={{ color: stat.nulls > 0 ? '#ef4444' : '#10b981', fontWeight: stat.nulls > 0 ? '700' : '500' }}>
                    {stat.nulls > 0 ? `⚠️ ${stat.nulls}` : '0 (None)'}
                  </span>
                </td>
                <td>
                  {isNumeric ? (stat.mean !== undefined ? Number(stat.mean).toLocaleString() : '-') : `${stat.unique || 0} unique`}
                </td>
                <td>
                  {isNumeric ? (stat.median !== undefined ? Number(stat.median).toLocaleString() : '-') : '-'}
                </td>
                <td>
                  {isNumeric ? `${stat.min !== undefined ? Number(stat.min).toLocaleString() : '-'} / ${stat.max !== undefined ? Number(stat.max).toLocaleString() : '-'}` : '-'}
                </td>
                <td>
                  {isNumeric ? (
                    stat.outliers > 0 ? (
                      <span style={{ color: '#f59e0b', fontWeight: '600' }}>⚠️ {stat.outliers} flagged</span>
                    ) : (
                      <span style={{ color: '#10b981' }}>0 clean</span>
                    )
                  ) : (
                    stat.top_values
                      ? Object.entries(stat.top_values)
                          .slice(0, 2)
                          .map(([k, v]) => `${k} (${v})`)
                          .join(', ')
                      : '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StatsTable;
