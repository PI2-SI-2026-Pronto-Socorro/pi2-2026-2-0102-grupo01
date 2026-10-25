require('dotenv').config();
const { initPool } = require('./db');
const { bootstrap } = require('./db/bootstrap');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  initPool();
  await bootstrap();
  app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar o servidor:', erro);
  process.exit(1);
});
