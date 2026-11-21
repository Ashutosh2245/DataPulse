import React, { useState } from 'react';

const Charts = ({ charts, summary }) => {
  const numCols = summary?.numeric_columns || [];
  const catCols = summary?.categorical_columns || [];
  const stats = summary?.stats || {};

  // 1. Histogram State
  const [histCol, setHistCol] = useState(numCols[0] || '');
  const [histBinsCount, setHistBinsCount] = useState(10);

  // 2. Scatter State
  const [scatterX, setScatterX] = useState(numCols[0] || '');
  const [scatterY, setScatterY] = useState(numCols[1] || numCols[0] || '');

  // 3. Bar Chart State
  const [barCol, setBarCol] = useState(catCols[0] || (numCols.length > 0 ? numCols[0] : ''));
  const [barSortDesc, setBarSortDesc] = useState(true);

  // 4. Boxplot State
  const [boxCol, setBoxCol] = useState(numCols[0] || '');

  // 5. Donut State
  const [donutCol, setDonutCol] = useState(catCols[0] || '');

  // 6. Line Trend State
  const [lineCol, setLineCol] = useState(numCols[0] || '');

  if (!charts) {
    return <div className="card"><p style={{ color: '#94a3b8' }}>No chart data available for this dataset.</p></div>;
  }

  // --- Dynamic Calculation Helpers ---
  const activeHistData = charts.histogram?.[histCol] || (charts.histogram ? Object.values(charts.histogram)[0] : null);
  const activeBoxData = charts.boxplot?.[boxCol] || (charts.boxplot ? Object.values(charts.boxplot)[0] : null);
  const activeBarData = charts.bar || {};
  const activeDonutData = charts.donut || {};
  const activeScatterData = charts.scatter || {};
  const activeLineData = charts.line || {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))', gap: '1.75rem' }}>
      
      {/* ========================================================
          1. DISTRIBUTION HISTOGRAM
         ======================================================== */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📈</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                Frequency Distribution Histogram
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Shows the spread, central tendency, and skewness of numeric data
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Column:</label>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={histCol}
              onChange={(e) => setHistCol(e.target.value)}
            >
              {numCols.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {activeHistData && activeHistData.counts && activeHistData.counts.length > 0 ? (
          <div>
            <svg viewBox="0 0 540 210" style={{ width: '100%', height: '210px', overflow: 'visible' }}>
              <line x1="45" y1="20" x2="520" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="45" y1="85" x2="520" y2="85" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="45" y1="150" x2="520" y2="150" stroke="#475569" strokeWidth="1.5" />

              {(() => {
                const maxCount = Math.max(...activeHistData.counts, 1);
                const chartH = 130;
                const barW = 460 / activeHistData.counts.length - 8;

                return activeHistData.counts.map((cnt, i) => {
                  const barH = (cnt / maxCount) * chartH;
                  const x = 52 + i * (barW + 8);
                  const y = 150 - barH;
                  const binLabel = activeHistData.bins ? activeHistData.bins[i] : i;

                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        fill="url(#blueGradient)"
                        rx="4"
                        opacity="0.9"
                      >
                        <title>{`Bin Range: ${binLabel}\nCount: ${cnt}`}</title>
                      </rect>
                      {cnt > 0 && (
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#93c5fd" fontWeight="700">
                          {cnt}
                        </text>
                      )}
                      <text x={x + barW / 2} y="168" textAnchor="middle" fontSize="9" fill="#94a3b8">
                        {binLabel}
                      </text>
                    </g>
                  );
                });
              })()}

              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>

            {/* Description & Insight */}
            <div style={{ backgroundColor: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                <span>💡 Statistical Insight ({histCol}):</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                The distribution for <strong>{histCol}</strong> spans from <strong>{stats[histCol]?.min ?? 'N/A'}</strong> to <strong>{stats[histCol]?.max ?? 'N/A'}</strong> with an average mean of <strong>{stats[histCol]?.mean ?? 'N/A'}</strong> (Median: {stats[histCol]?.median ?? 'N/A'}).
                {stats[histCol]?.std ? ` Standard deviation is ${stats[histCol]?.std}, showing ${stats[histCol]?.std > 10 ? 'high variability' : 'moderate clustering'}.` : ''}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No numeric data available for histogram.</p>
        )}
      </div>

      {/* ========================================================
          2. CORRELATION SCATTER PLOT
         ======================================================== */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🔵</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                Bivariate Scatter & Trend
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Plot two numeric features to uncover patterns, clusters, and linear correlations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>X:</span>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              value={scatterX}
              onChange={(e) => setScatterX(e.target.value)}
            >
              {numCols.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>

            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Y:</span>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              value={scatterY}
              onChange={(e) => setScatterY(e.target.value)}
            >
              {numCols.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>

        {activeScatterData.x && activeScatterData.x.length > 0 ? (
          <div>
            <svg viewBox="0 0 540 210" style={{ width: '100%', height: '210px' }}>
              <line x1="55" y1="20" x2="55" y2="160" stroke="#475569" strokeWidth="1.5" />
              <line x1="55" y1="160" x2="520" y2="160" stroke="#475569" strokeWidth="1.5" />
              <line x1="55" y1="90" x2="520" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              {(() => {
                const minX = Math.min(...activeScatterData.x);
                const maxX = Math.max(...activeScatterData.x);
                const minY = Math.min(...activeScatterData.y);
                const maxY = Math.max(...activeScatterData.y);
                const spanX = maxX - minX || 1;
                const spanY = maxY - minY || 1;

                return activeScatterData.x.map((xVal, i) => {
                  const yVal = activeScatterData.y[i];
                  const cx = 70 + ((xVal - minX) / spanX) * 430;
                  const cy = 150 - ((yVal - minY) / spanY) * 120;

                  return (
                    <circle key={i} cx={cx} cy={cy} r="5" fill="#818cf8" stroke="#312e81" strokeWidth="1.5" opacity="0.9">
                      <title>{`(${activeScatterData.x_column}: ${xVal}, ${activeScatterData.y_column}: ${yVal})`}</title>
                    </circle>
                  );
                });
              })()}

              <text x="290" y="195" textAnchor="middle" fontSize="11" fill="#cbd5e1" fontWeight="700">
                {activeScatterData.x_column || scatterX} ➔
              </text>
              <text x="20" y="90" textAnchor="middle" fontSize="11" fill="#cbd5e1" fontWeight="700" transform="rotate(-90 20 90)">
                {activeScatterData.y_column || scatterY} ➔
              </text>
            </svg>

            {/* Description & Insight */}
            <div style={{ backgroundColor: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                <span>💡 Correlation Analysis:</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Plotting <strong>{scatterX}</strong> against <strong>{scatterY}</strong>. Data points illustrate the bivariate relationship. If points slope upward to the right, higher {scatterX} correlates with higher {scatterY}.
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Scatter plot requires at least one numeric feature.</p>
        )}
      </div>

      {/* ========================================================
          3. CATEGORY BAR CHART
         ======================================================== */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📊</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                Category Frequency Bar Chart
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Ranks categorical values by frequency count and relative dominance
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target:</label>
            <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>{activeBarData.column || 'Categories'}</span>
          </div>
        </div>

        {activeBarData.category && activeBarData.category.length > 0 ? (
          <div>
            <svg viewBox="0 0 540 210" style={{ width: '100%', height: '210px' }}>
              <line x1="50" y1="150" x2="520" y2="150" stroke="#475569" strokeWidth="1.5" />
              {(() => {
                const maxVal = Math.max(...activeBarData.counts, 1);
                const barW = 440 / activeBarData.category.length - 10;

                return activeBarData.category.map((cat, i) => {
                  const cnt = activeBarData.counts[i];
                  const barH = (cnt / maxVal) * 120;
                  const x = 60 + i * (barW + 10);
                  const y = 150 - barH;

                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barW} height={barH} fill="url(#greenGradient)" rx="4" opacity="0.9">
                        <title>{`${cat}: ${cnt} occurrences`}</title>
                      </rect>
                      <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#6ee7b7" fontWeight="700">
                        {cnt}
                      </text>
                      <text x={x + barW / 2} y="172" textAnchor="middle" fontSize="9" fill="#94a3b8">
                        {String(cat).length > 8 ? `${String(cat).substring(0, 7)}…` : cat}
                      </text>
                    </g>
                  );
                });
              })()}

              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>

            {/* Description & Insight */}
            <div style={{ backgroundColor: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                <span>💡 Categorical Dominance:</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong>{activeBarData.category[0]}</strong> is the leading category with <strong>{activeBarData.counts[0]}</strong> occurrences, followed by {activeBarData.category[1] ? `"${activeBarData.category[1]}" (${activeBarData.counts[1]})` : 'other classes'}.
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No categorical categories to display.</p>
        )}
      </div>

      {/* ========================================================
          4. BOX & WHISKER PLOT
         ======================================================== */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📦</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                Five-Number Box & Whisker Plot
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Visualizes Minimum, Q1 (25%), Median, Q3 (75%), Maximum, and outlier flags
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Feature:</label>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={boxCol}
              onChange={(e) => setBoxCol(e.target.value)}
            >
              {numCols.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>

        {activeBoxData ? (
          <div>
            <svg viewBox="0 0 540 190" style={{ width: '100%', height: '190px' }}>
              {(() => {
                const min = activeBoxData.min;
                const max = activeBoxData.max;
                const span = max - min || 1;
                const toX = (val) => 65 + ((val - min) / span) * 400;

                const xMin = toX(activeBoxData.min);
                const xQ25 = toX(activeBoxData.q25);
                const xMed = toX(activeBoxData.median);
                const xQ75 = toX(activeBoxData.q75);
                const xMax = toX(activeBoxData.max);

                return (
                  <g>
                    {/* Whiskers */}
                    <line x1={xMin} y1="85" x2={xQ25} y2="85" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1={xMin} y1="60" x2={xMin} y2="110" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1={xQ75} y1="85" x2={xMax} y2="85" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1={xMax} y1="60" x2={xMax} y2="110" stroke="#38bdf8" strokeWidth="2.5" />

                    {/* IQR Box */}
                    <rect x={xQ25} y="50" width={Math.max(xQ75 - xQ25, 4)} height="70" fill="rgba(14, 165, 233, 0.2)" stroke="#38bdf8" strokeWidth="2" rx="4" />
                    
                    {/* Median Line */}
                    <line x1={xMed} y1="50" x2={xMed} y2="120" stroke="#f59e0b" strokeWidth="3.5" />

                    {/* Outliers */}
                    {activeBoxData.outliers && activeBoxData.outliers.map((outVal, idx) => (
                      <circle key={idx} cx={toX(outVal)} cy="85" r="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1">
                        <title>{`Outlier: ${outVal}`}</title>
                      </circle>
                    ))}

                    {/* Numerical Labels */}
                    <text x={xMin} y="138" textAnchor="middle" fontSize="10" fill="#94a3b8">Min: {activeBoxData.min}</text>
                    <text x={xQ25} y="40" textAnchor="middle" fontSize="10" fill="#38bdf8" fontWeight="600">Q1: {activeBoxData.q25}</text>
                    <text x={xMed} y="138" textAnchor="middle" fontSize="11" fill="#fbbf24" fontWeight="800">Median: {activeBoxData.median}</text>
                    <text x={xQ75} y="40" textAnchor="middle" fontSize="10" fill="#38bdf8" fontWeight="600">Q3: {activeBoxData.q75}</text>
                    <text x={xMax} y="138" textAnchor="middle" fontSize="10" fill="#94a3b8">Max: {activeBoxData.max}</text>
                  </g>
                );
              })()}
            </svg>

            {/* Description & Insight */}
            <div style={{ backgroundColor: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                <span>💡 Quartile Spread & Outliers ({boxCol}):</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                The middle 50% of <strong>{boxCol}</strong> values fall between <strong>{activeBoxData.q25}</strong> and <strong>{activeBoxData.q75}</strong> (IQR = {(activeBoxData.q75 - activeBoxData.q25).toFixed(2)}).
                {activeBoxData.outliers?.length > 0
                  ? ` ⚠️ Detected ${activeBoxData.outliers.length} anomalous outlier(s): [${activeBoxData.outliers.join(', ')}].`
                  : ' No statistical outliers detected beyond the 1.5×IQR boundary.'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Box plot requires numeric data points.</p>
        )}
      </div>

      {/* ========================================================
          5. DONUT / PROPORTIONS CHART
         ======================================================== */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🍩</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                Proportional Share Donut
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Relative contribution and percentage partition of classes
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-processing" style={{ fontSize: '0.75rem' }}>{activeDonutData.column || 'Proportions'}</span>
          </div>
        </div>

        {activeDonutData.category && activeDonutData.category.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', padding: '1rem 0' }}>
              <svg viewBox="0 0 160 160" style={{ width: '150px', height: '150px' }}>
                {(() => {
                  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];
                  let cumulativeAngle = 0;
                  const radius = 55;
                  const cx = 80;
                  const cy = 80;

                  return activeDonutData.percentages.map((pct, idx) => {
                    const angle = (pct / 100) * 360;
                    const startRad = (cumulativeAngle - 90) * (Math.PI / 180);
                    const endRad = (cumulativeAngle + angle - 90) * (Math.PI / 180);
                    cumulativeAngle += angle;

                    const x1 = cx + radius * Math.cos(startRad);
                    const y1 = cy + radius * Math.sin(startRad);
                    const x2 = cx + radius * Math.cos(endRad);
                    const y2 = cy + radius * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;

                    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    return (
                      <path
                        key={idx}
                        d={pathData}
                        fill={palette[idx % palette.length]}
                        stroke="#1f2937"
                        strokeWidth="2.5"
                      >
                        <title>{`${activeDonutData.category[idx]}: ${pct}% (${activeDonutData.counts[idx]})`}</title>
                      </path>
                    );
                  });
                })()}
                <circle cx="80" cy="80" r="32" fill="#1f2937" />
              </svg>

              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {activeDonutData.category.map((cat, idx) => {
                  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: palette[idx % palette.length] }} />
                      <span style={{ fontWeight: '600', color: '#f8fafc' }}>{cat}:</span>
                      <span style={{ color: '#94a3b8' }}>{activeDonutData.percentages[idx]}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description & Insight */}
            <div style={{ backgroundColor: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                <span>💡 Percentage Share Insight:</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Top category <strong>"{activeDonutData.category[0]}"</strong> constitutes <strong>{activeDonutData.percentages[0]}%</strong> of all observed classes in {activeDonutData.column}.
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No categorical classes for donut chart.</p>
        )}
      </div>

      {/* ========================================================
          6. LINE PROGRESSION CHART
         ======================================================== */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📉</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                Sequential Progression Curve
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Tracks values row-by-row across observation sequence to spot volatility
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Metric:</label>
            <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>{activeLineData.column || 'Trend'}</span>
          </div>
        </div>

        {activeLineData.values && activeLineData.values.length > 0 ? (
          <div>
            <svg viewBox="0 0 540 210" style={{ width: '100%', height: '210px' }}>
              <line x1="50" y1="20" x2="520" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="50" y1="85" x2="520" y2="85" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="50" y1="150" x2="520" y2="150" stroke="#475569" strokeWidth="1.5" />

              {(() => {
                const min = Math.min(...activeLineData.values);
                const max = Math.max(...activeLineData.values);
                const span = max - min || 1;
                const toX = (i) => 60 + (i / (activeLineData.values.length - 1 || 1)) * 440;
                const toY = (val) => 140 - ((val - min) / span) * 115;

                const points = activeLineData.values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

                return (
                  <g>
                    <polyline fill="none" stroke="#a855f7" strokeWidth="3" points={points} />
                    {activeLineData.values.map((v, i) => (
                      <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill="#c084fc" stroke="#581c87" strokeWidth="1.5">
                        <title>{`Record index ${i}: ${v}`}</title>
                      </circle>
                    ))}
                    <text x="50" y="175" fontSize="10" fill="#94a3b8">Start (Row 0)</text>
                    <text x="510" y="175" textAnchor="end" fontSize="10" fill="#94a3b8">End (Row {activeLineData.values.length - 1})</text>
                  </g>
                );
              })()}
            </svg>

            {/* Description & Insight */}
            <div style={{ backgroundColor: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                <span>💡 Trajectory Insight:</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Tracks sequential shifts in <strong>{activeLineData.column}</strong>. Peak is <strong>{Math.max(...activeLineData.values)}</strong> and lowest point is <strong>{Math.min(...activeLineData.values)}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No sequential numeric values to track.</p>
        )}
      </div>

    </div>
  );
};

export default Charts;
