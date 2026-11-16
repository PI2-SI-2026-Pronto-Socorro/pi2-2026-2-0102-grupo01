const AltaAtendimentoService = require('../services/AltaAtendimentoService');

async function listarConfirmados(req, res) {
  const atendimentosConfirmados = await AltaAtendimentoService.listarConfirmados();
  res.json(atendimentosConfirmados);
}

async function darAlta(req, res) {
  const atendimentoEncerrado = await AltaAtendimentoService.darAlta(req.params.numero);
  res.json(atendimentoEncerrado);
}

module.exports = { listarConfirmados, darAlta };
