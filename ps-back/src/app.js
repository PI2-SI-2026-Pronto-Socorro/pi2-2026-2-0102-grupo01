const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const logger = require('./middlewares/logger');
const routes = require('./routes');

const swaggerSpec = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'));

const app = express();
const frontDir = path.join(__dirname, '..', '..', 'ps-front');

app.use(express.json());
app.use(cors());
app.use(logger);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontDir, 'landing.html'));
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'API Pronto-Socorro',
  swaggerOptions: {
    docExpansion: 'none',
    tryItOutEnabled: true,
    persistAuthorization: true,
    filter: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: -1,
  },
}));
app.use(express.static(frontDir));
app.use('/vendor/bootstrap', express.static(path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist')));
app.use('/api', routes);

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  if (erro.type === 'entity.too.large') return res.status(413).json({ detail: 'Corpo da requisição grande demais' });
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ detail: 'JSON inválido no corpo da requisição' });
  if (erro instanceof URIError) return res.status(400).json({ detail: 'Endereço com caracteres inválidos' });
  if (erro.status >= 400 && erro.status < 500) return res.status(erro.status).json({ detail: 'Requisição inválida' });
  console.error(erro);
  return res.status(500).json({ detail: 'Erro interno no servidor' });
});

module.exports = app;
