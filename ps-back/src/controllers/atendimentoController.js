const pacienteModel = require('../models/pacienteModel');
const atendimentoModel = require('../models/atendimentoModel');

async function criar(req, res) {
  const { id_paciente, status = 'Em espera' } = req.body || {};
  if (!Number.isInteger(id_paciente)) return res.status(422).json({ detail: 'id_paciente inválido' });
  if (typeof status !== 'string' || status.length > 30) return res.status(422).json({ detail: 'Status inválido' });

  if (!(await pacienteModel.existe(id_paciente))) return res.status(404).json({ detail: 'Paciente não existe' });

  const novo = await atendimentoModel.criar({ id_paciente, status });
  res.status(201).json({ id_atendimento: novo.id_atendimento, id_paciente, status });
}

module.exports = { criar };
