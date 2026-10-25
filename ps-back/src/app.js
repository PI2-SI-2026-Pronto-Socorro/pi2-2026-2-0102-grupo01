const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middlewares/logger');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(logger);

app.use(express.static(path.join(__dirname, '..', '..', 'ps-front')));
app.use('/api', routes);

module.exports = app;
