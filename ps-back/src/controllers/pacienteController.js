const PacienteService = require('../services/PacienteService');


async function findAll(req, res) {
  res.json(await PacienteService.listar());
}

async function findOne(req, res) {
  res.json(await PacienteService.buscarPorCpf(req.params.cpf));
}

async function create(req, res) {
  res.status(201).json(await PacienteService.cadastrar(req.body || {}));
}

module.exports = { findAll, findOne, create };
