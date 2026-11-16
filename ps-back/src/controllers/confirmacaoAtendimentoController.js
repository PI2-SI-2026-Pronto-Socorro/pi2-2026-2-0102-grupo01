const ConfirmacaoAtendimentoService = require('../services/ConfirmacaoAtendimentoService');

async function confirmarAtendimento(req, res) {
  const atendimentoConfirmado = await ConfirmacaoAtendimentoService.confirmarAtendimento(req.params.numero);
  res.json(atendimentoConfirmado);
}

module.exports = { confirmarAtendimento };
