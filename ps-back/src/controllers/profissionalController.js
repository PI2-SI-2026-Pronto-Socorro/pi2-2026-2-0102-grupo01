const ProfissionalService = require('../services/ProfissionalService');

async function findAll(req, res) {
  const listaProfissionais = await ProfissionalService.listarProfissionais();
  res.json(listaProfissionais);
}

module.exports = { findAll };
