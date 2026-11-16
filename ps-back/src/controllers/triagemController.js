const TriagemService = require('../services/TriagemService');

async function create(req, res) {
  const triagemCriada = await TriagemService.registrarTriagem(req.params.numero, req.body || {});
  res.status(201).json(triagemCriada);
}

module.exports = { create };
