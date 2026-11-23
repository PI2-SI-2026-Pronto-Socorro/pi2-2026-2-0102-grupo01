const DetalhesAtendimentoService = require('../services/DetalhesAtendimentoService');
const { garantirAcessoDaRecepcao } = require('../services/AtendimentoService');

async function findDetalhes(req, res) {
  const detalhesAtendimento = await DetalhesAtendimentoService.buscarDetalhesAtendimento(req.params.numero);
  garantirAcessoDaRecepcao(req.usuario, detalhesAtendimento.atendimento.status_atendimento);
  res.json(detalhesAtendimento);
}

module.exports = { findDetalhes };
