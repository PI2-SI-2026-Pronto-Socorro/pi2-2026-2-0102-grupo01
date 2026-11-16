const PainelAtendimentosService = require('../services/PainelAtendimentosService');

async function findPainel(req, res) {
  const painelAtendimentos = await PainelAtendimentosService.montarPainelAtendimentos();
  res.json(painelAtendimentos);
}

module.exports = { findPainel };
