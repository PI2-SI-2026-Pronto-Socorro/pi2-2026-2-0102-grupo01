const ProfissionalRepository = require('../repositories/ProfissionalRepository');

async function listarProfissionais() {
  return ProfissionalRepository.listarProfissionaisPorNome();
}

module.exports = { listarProfissionais };
