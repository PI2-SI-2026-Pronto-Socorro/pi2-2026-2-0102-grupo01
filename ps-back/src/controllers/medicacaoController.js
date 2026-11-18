const MedicacaoService = require('../services/MedicacaoService');

async function create(req, res) {
  const prescricaoGravada = await MedicacaoService.registrarMedicacoes(req.params.numero, req.body || {});
  res.status(201).json(prescricaoGravada);
}

module.exports = { create };
