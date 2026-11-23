const TriagemService = require('../services/TriagemService');
const { corpoComProfissionalLogado } = require('../middlewares/autenticacao');

async function create(req, res) {
  const triagemCriada = await TriagemService.registrarTriagem(req.params.numero, corpoComProfissionalLogado(req));
  res.status(201).json(triagemCriada);
}

module.exports = { create };
