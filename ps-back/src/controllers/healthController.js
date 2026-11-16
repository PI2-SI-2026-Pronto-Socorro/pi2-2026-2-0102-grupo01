const PacienteService = require('../services/PacienteService');

async function check(req, res) {
  try {
    res.json({ banco: 'ok', pacientes: await PacienteService.contar() });
  } catch (erro) {
    res.status(500).json({ banco: 'erro', detail: erro.message });
  }
}

module.exports = { check };
