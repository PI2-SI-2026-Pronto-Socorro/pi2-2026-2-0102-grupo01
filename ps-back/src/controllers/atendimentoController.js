const AtendimentoService = require('../services/AtendimentoService');


async function create(req, res) {
  const novo = await AtendimentoService.abrir(req.body || {});
  res.status(201).json(novo);
}

async function findByNumero(req, res) {
  res.json(await AtendimentoService.buscarPorNumero(req.params.numero));
}

async function findByCpf(req, res) {
  res.json(await AtendimentoService.buscarPorCpf(req.query.cpf ?? ''));
}

module.exports = { create, findByNumero, findByCpf };
