const { drizzle } = require('drizzle-orm/node-postgres');

const connectionString = process.env.DATABASE_URL;
const isLocalDatabase = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);

const db = drizzle({
  connection: {
    connectionString,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: true }, // o Neon exige SSL
  },
});

module.exports = { db };
