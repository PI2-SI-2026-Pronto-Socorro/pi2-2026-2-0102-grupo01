const ProfissionalService = require('../services/ProfissionalService');

async function findAll(req, res) {
  const listaProfissionais = await ProfissionalService.listarProfissionais();
  res.json(listaProfissionais);
}

async function create(req, res) {
  const profissionalCadastrado = await ProfissionalService.cadastrarProfissional(req.body, req.usuario);
  res.status(201).json(profissionalCadastrado);
}

module.exports = { findAll, create };
