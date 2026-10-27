const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

let db = null;

// Cria (ou reutiliza) o pool de conexões com o Neon.
function initPool() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    const isLocalDatabase = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);

    const pool = new Pool({
      connectionString,
      ssl: isLocalDatabase ? false : { rejectUnauthorized: true },
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
