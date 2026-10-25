const pacienteModel = require('../models/pacienteModel');

// Operação de teste: confirma a conexão lendo a tabela paciente
async function verificar(req, res) {
  try {
    res.json({ banco: 'ok', pacientes: await pacienteModel.contar() });
  } catch (erro) {
    res.status(500).json({ banco: 'erro', detail: erro.message });
  }
}

module.exports = { verificar };
