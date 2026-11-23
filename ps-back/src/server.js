require('dotenv').config();

const { segredoValido, TAMANHO_MINIMO_DO_SEGREDO } = require('./utils/token');

if (process.env.AUTH_OBRIGATORIA === 'true' && !segredoValido(process.env.AUTH_SECRET)) {
  console.error(
    `Com AUTH_OBRIGATORIA=true, troque o AUTH_SECRET do .env por um texto aleatório seu com pelo menos ${TAMANHO_MINIMO_DO_SEGREDO} caracteres`,
  );
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
