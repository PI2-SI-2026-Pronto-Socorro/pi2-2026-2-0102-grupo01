const MedicacaoService = require('../services/MedicacaoService');
const { corpoComProfissionalLogado } = require('../middlewares/autenticacao');

async function create(req, res) {
  const prescricaoGravada = await MedicacaoService.registrarMedicacoes(req.params.numero, corpoComProfissionalLogado(req));
  res.status(201).json(prescricaoGravada);
}

module.exports = { create };
