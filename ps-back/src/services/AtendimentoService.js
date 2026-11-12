const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const Atendimento = require('../models/Atendimento');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function abrir({ id_paciente }) {
  const status_atendimento = 'Aberto';
  if (typeof id_paciente !== 'string' || !UUID.test(id_paciente)) throw new ErroHttp(422, 'id_paciente inválido');

  if (!(await PacienteRepository.exists(id_paciente))) throw new ErroHttp(404, 'Paciente não existe');

  const emAndamento = await AtendimentoRepository.findEmAndamento(id_paciente);
  if (emAndamento) {
    throw new ErroHttp(409, `Paciente já possui atendimento em andamento (nº ${emAndamento.numero_atendimento})`);
  }

  const novo = new Atendimento({ id_paciente, status_atendimento });
  try {
    return new Atendimento(await AtendimentoRepository.create(novo.paraInsercao()));
  } catch (e) {
    if (codigoPg(e) === '23505') throw new ErroHttp(409, 'Paciente já possui atendimento em andamento');
    throw e;
  }
}

function normalizarNumero(numero) {
  const numeroNormalizado = String(numero).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroNormalizado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');
  return numeroNormalizado;
}

async function buscarPorNumero(numero) {
  const numeroNormalizado = normalizarNumero(numero);

  const linha = await AtendimentoRepository.findByNumero(numeroNormalizado);
  if (!linha) throw new ErroHttp(404, 'Atendimento não encontrado');
  return { ...new Atendimento(linha), nome: linha.nome, cpf: linha.cpf };
}

async function buscarPorCpf(cpf) {
  if (!/^\d{11}$/.test(cpf)) throw new ErroHttp(422, 'CPF deve ter 11 números');

  const linhas = await AtendimentoRepository.findByCpf(cpf);
  return linhas.map((linha) => ({ ...new Atendimento(linha), nome: linha.nome, cpf: linha.cpf }));
}

async function listarAbertos() {
  return AtendimentoRepository.findAbertos();
}

async function cancelar(numero) {
  const numeroNormalizado = normalizarNumero(numero);

  const cancelado = await AtendimentoRepository.cancelarSeAberto(numeroNormalizado);
  if (cancelado) return new Atendimento(cancelado);

  const atual = await AtendimentoRepository.findByNumero(numeroNormalizado);
  if (!atual) throw new ErroHttp(404, 'Atendimento não encontrado');
  throw new ErroHttp(
    409,
    `Só é possível cancelar atendimento em Aberto (situação atual: ${atual.status_atendimento})`,
  );
}

async function painel() {
  const atendimentos = await AtendimentoRepository.findPainel();
  const resumo = { Aberto: 0, Triado: 0, Confirmado: 0, Encerrado: 0, Cancelado: 0 };
  for (const a of atendimentos) resumo[a.status_atendimento] += 1;
  return { resumo, atendimentos };
}

module.exports = { abrir, buscarPorNumero, buscarPorCpf, listarAbertos, cancelar, painel };
