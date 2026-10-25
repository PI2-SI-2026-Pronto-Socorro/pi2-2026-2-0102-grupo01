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

app.use(express.json());
app.use(cors());
app.use(logger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // documentação da API
app.use(express.static(path.join(__dirname, '..', '..', 'ps-front'))); // serve o front
app.use('/api', routes);

module.exports = app;
