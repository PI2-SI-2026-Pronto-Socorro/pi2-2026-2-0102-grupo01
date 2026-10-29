require('dotenv').config();
const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.js',
  dbCredentials: { url: process.env.DATABASE_URL },
});
