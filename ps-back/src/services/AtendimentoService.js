const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const Atendimento = require('../models/Atendimento');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

async function abrir({ id_paciente }) {
  const status = 'Aberto';
  if (!Number.isInteger(id_paciente)) throw new ErroHttp(422, 'id_paciente inválido');

  if (!(await PacienteRepository.exists(id_paciente))) throw new ErroHttp(404, 'Paciente não existe');

  const emAndamento = await AtendimentoRepository.findEmAndamento(id_paciente);
  if (emAndamento) {
    throw new ErroHttp(409, `Paciente já possui atendimento em andamento (nº ${emAndamento.id_atendimento})`);
  }

  const novo = new Atendimento({ id_paciente, status });
  try {
    return new Atendimento(await AtendimentoRepository.create(novo.paraInsercao()));
  } catch (e) {
    if (codigoPg(e) === '23505') throw new ErroHttp(409, 'Paciente já possui atendimento em andamento');
    throw e;
  }
}

async function buscarPorNumero(numero) {
  const id = Number(numero);
  if (!Number.isInteger(id) || id < 1) throw new ErroHttp(422, 'Número do atendimento inválido');

  const linha = await AtendimentoRepository.findById(id);
  if (!linha) throw new ErroHttp(404, 'Atendimento não encontrado');
  return new Atendimento(linha);
}

async function buscarPorCpf(cpf) {
  if (!/^\d{11}$/.test(cpf)) throw new ErroHttp(422, 'CPF deve ter 11 números');

  const linhas = await AtendimentoRepository.findByCpf(cpf);
  return linhas.map((linha) => new Atendimento(linha));
}

async function listarAbertos() {
  return AtendimentoRepository.findAbertos();
}

module.exports = { abrir, buscarPorNumero, buscarPorCpf, listarAbertos };
