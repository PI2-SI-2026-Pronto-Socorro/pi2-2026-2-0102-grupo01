require('dotenv').config(); // antes de qualquer uso de process.env
const express = require('express');
const path = require('path');
const routes = require('./src/routes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'ps-front'))); // serve o front
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
