const db = require('./db');

const createUser = async (name, email, passwordHash) => {
  const sql = `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at;
  `;
  const result = await db.query(sql, [name, email.toLowerCase().trim(), passwordHash]);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const sql = `
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE LOWER(email) = LOWER($1);
  `;
  const result = await db.query(sql, [email.trim()]);
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const sql = `
    SELECT id, name, email, created_at
    FROM users
    WHERE id = $1;
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
