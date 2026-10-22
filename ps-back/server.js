const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'ps-front'))); // serve o front

let pacientes = [];

app.get('/api/pacientes', (req, res) => res.json(pacientes));

app.post('/api/pacientes', (req, res) => {
  const { nome, prioridade } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório' });
  const novo = { id: Date.now(), nome, prioridade: prioridade || 'verde' };
  pacientes.push(novo);
  res.status(201).json(novo);
});

app.delete('/api/pacientes/:id', (req, res) => {
  pacientes = pacientes.filter(p => p.id !== Number(req.params.id));
  res.status(204).end();
});

app.listen(3000, () => console.log('Rodando em http://localhost:3000'));