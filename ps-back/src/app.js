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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.static(frontDir));
app.use('/vendor/bootstrap', express.static(path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist')));
app.use('/api', routes);

module.exports = app;
