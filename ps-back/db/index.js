const { Pool } = require('pg');

// Com DATABASE_URL (Neon), conecta por ela usando SSL.
// Sem ela, lê PGHOST, PGPORT, PGUSER, PGPASSWORD e PGDATABASE do .env (banco local).
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } })
  : new Pool();

module.exports = pool;
