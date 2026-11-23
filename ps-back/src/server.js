require('dotenv').config();

const TAMANHO_MINIMO_DO_SEGREDO = 32;
if (process.env.AUTH_OBRIGATORIA === 'true' && (process.env.AUTH_SECRET ?? '').length < TAMANHO_MINIMO_DO_SEGREDO) {
  console.error(`Com AUTH_OBRIGATORIA=true, defina no .env um AUTH_SECRET com pelo menos ${TAMANHO_MINIMO_DO_SEGREDO} caracteres`);
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
