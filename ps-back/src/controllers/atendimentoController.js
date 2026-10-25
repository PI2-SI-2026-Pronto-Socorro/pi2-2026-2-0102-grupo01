const AtendimentoService = require('../services/AtendimentoService');


async function create(req, res) {
  const novo = await AtendimentoService.abrir(req.body || {});
  res.status(201).json({ id_atendimento: novo.id_atendimento, id_paciente: novo.id_paciente, status: novo.status });
}

module.exports = { create };
