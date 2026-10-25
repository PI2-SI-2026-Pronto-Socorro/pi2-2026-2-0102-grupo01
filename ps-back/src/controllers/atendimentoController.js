const AtendimentoService = require('../services/AtendimentoService');


async function create(req, res) {
  const novo = await AtendimentoService.abrir(req.body || {});
  res.status(201).json(novo);
}

module.exports = { create };
