const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const Atendimento = require('../models/Atendimento');
const ErroHttp = require('../utils/ErroHttp');

async function abrir({ id_paciente }) {
  const status = 'Aberto';
  if (!Number.isInteger(id_paciente)) throw new ErroHttp(422, 'id_paciente inválido');
  if (typeof status !== 'string' || status.length > 30) throw new ErroHttp(422, 'Status inválido');

  if (!(await PacienteRepository.exists(id_paciente))) throw new ErroHttp(404, 'Paciente não existe');

  const novo = new Atendimento({ id_paciente, status });
  return new Atendimento(await AtendimentoRepository.create(novo.paraInsercao()));
}

module.exports = { abrir };
