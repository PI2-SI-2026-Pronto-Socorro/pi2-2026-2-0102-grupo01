const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

let db = null;

// Cria (ou reutiliza) o pool de conexões com o Neon.
function initPool() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true }, // o Neon exige SSL
    });
    db = drizzle(pool);
  }
  return db;
}

// Entrega a conexão para os repositórios.
function getConnection() {
  return initPool();
}

module.exports = { initPool, getConnection };
