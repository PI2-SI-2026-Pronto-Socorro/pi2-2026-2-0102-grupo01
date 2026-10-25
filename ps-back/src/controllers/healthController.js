const PacienteRepository = require('../repositories/PacienteRepository');

// Operação de teste: confirma a conexão lendo a tabela paciente
async function check(req, res) {
  try {
    res.json({ banco: 'ok', pacientes: await PacienteRepository.count() });
  } catch (erro) {
    res.status(500).json({ banco: 'erro', detail: erro.message });
  }
}

module.exports = { check };
