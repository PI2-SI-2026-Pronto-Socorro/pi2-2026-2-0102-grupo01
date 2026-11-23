const ProfissionalService = require('../services/ProfissionalService');

async function findAll(req, res) {
  const listaProfissionais = await ProfissionalService.listarProfissionais();
  res.json(listaProfissionais);
}

async function create(req, res) {
  res.status(201).json(await ProfissionalService.cadastrar(req.body || {}));
}

module.exports = { findAll, create };
