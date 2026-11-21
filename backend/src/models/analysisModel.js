const db = require('./db');

const createAnalysis = async (datasetId, summaryJson, chartsJson) => {
  const sql = `
    INSERT INTO analyses (dataset_id, summary_json, charts_json)
    VALUES ($1, $2, $3)
    RETURNING id, dataset_id, analysis_time, summary_json, charts_json;
  `;
  const result = await db.query(sql, [
    datasetId,
    typeof summaryJson === 'string' ? summaryJson : JSON.stringify(summaryJson),
    typeof chartsJson === 'string' ? chartsJson : JSON.stringify(chartsJson),
  ]);
  return result.rows[0];
};

const getAnalysisByDatasetId = async (datasetId) => {
  const sql = `
    SELECT id, dataset_id, analysis_time, summary_json, charts_json
    FROM analyses
    WHERE dataset_id = $1
    ORDER BY analysis_time DESC
    LIMIT 1;
  `;
  const result = await db.query(sql, [datasetId]);
  return result.rows[0] || null;
};

module.exports = {
  createAnalysis,
  getAnalysisByDatasetId,
};
