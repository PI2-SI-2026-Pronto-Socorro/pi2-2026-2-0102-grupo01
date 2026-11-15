const DetalhesAtendimentoService = require('../services/DetalhesAtendimentoService');

async function findDetalhes(req, res) {
  const detalhesAtendimento = await DetalhesAtendimentoService.buscarDetalhesAtendimento(req.params.numero);
  res.json(detalhesAtendimento);
}

module.exports = { findDetalhes };
