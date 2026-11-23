const PacienteService = require('../services/PacienteService');

async function check(req, res) {
  try {
    await PacienteService.contar();
    res.json({ banco: 'ok' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ banco: 'erro' });
  }
}

module.exports = { check };
