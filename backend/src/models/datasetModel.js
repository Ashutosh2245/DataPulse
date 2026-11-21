const db = require('./db');

const createDataset = async (userId, filename, s3Key = null, status = 'pending') => {
  const sql = `
    INSERT INTO datasets (user_id, filename, s3_key, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, filename, uploaded_at, status, s3_key;
  `;
  const result = await db.query(sql, [userId, filename, s3Key, status]);
  return result.rows[0];
};

const getDatasetsByUser = async (userId) => {
  const sql = `
    SELECT id, filename, uploaded_at, status, s3_key
    FROM datasets
    WHERE user_id = $1
    ORDER BY uploaded_at DESC;
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
};

const getDatasetById = async (id) => {
  const sql = `
    SELECT id, user_id, filename, uploaded_at, status, s3_key
    FROM datasets
    WHERE id = $1;
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
};

const updateDatasetStatus = async (id, status) => {
  const sql = `
    UPDATE datasets
    SET status = $2
    WHERE id = $1
    RETURNING id, user_id, filename, uploaded_at, status, s3_key;
  `;
  const result = await db.query(sql, [id, status]);
  return result.rows[0] || null;
};

module.exports = {
  createDataset,
  getDatasetsByUser,
  getDatasetById,
  updateDatasetStatus,
};
