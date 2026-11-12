const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const PacienteService = require('./PacienteService');
const Atendimento = require('../models/Atendimento');
const Paciente = require('../models/Paciente');
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

// Pela Parte 4 do escopo, a recepção altera os dados enquanto o atendimento está em Aberto ou Triado.
const STATUS_SEM_ALTERACAO = ['Confirmado', 'Encerrado', 'Cancelado'];
const CAMPOS_PACIENTE = ['nome', 'cpf', 'data_nascimento', 'rg', 'genero', 'telefone'];
const CAMPOS_ATENDIMENTO = ['motivo_atendimento'];

function separarCamposAlteracao(dados) {
  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroHttp(422, 'Envie os dados a alterar em um objeto JSON');
  }
  const campos = Object.keys(dados);
  if (campos.length === 0) throw new ErroHttp(422, 'Informe ao menos um campo para alterar');

  const naoPermitido = campos.find((c) => !CAMPOS_PACIENTE.includes(c) && !CAMPOS_ATENDIMENTO.includes(c));
  if (naoPermitido) throw new ErroHttp(422, `Campo não pode ser alterado: ${naoPermitido}`);

  const dadosAtendimento = {};
  const dadosPaciente = {};
  for (const campo of campos) {
    (CAMPOS_ATENDIMENTO.includes(campo) ? dadosAtendimento : dadosPaciente)[campo] = dados[campo];
  }

  const motivo = dadosAtendimento.motivo_atendimento;
  if (motivo !== undefined && motivo !== null && (typeof motivo !== 'string' || motivo.length > 255)) {
    throw new ErroHttp(422, 'Motivo do atendimento inválido (até 255 caracteres)');
  }
  const erroPaciente = PacienteService.validarAlteracao(dadosPaciente);
  if (erroPaciente) throw new ErroHttp(422, erroPaciente);

  return { dadosAtendimento, dadosPaciente };
}

async function alterar(numero, dados) {
  const numeroNormalizado = normalizarNumero(numero);
  const { dadosAtendimento, dadosPaciente } = separarCamposAlteracao(dados);

  let resultado;
  try {
    resultado = await AtendimentoRepository.alterarDados(
      numeroNormalizado, dadosAtendimento, dadosPaciente, STATUS_SEM_ALTERACAO,
    );
  } catch (e) {
    if (codigoPg(e) === '23505') throw new ErroHttp(409, 'CPF já cadastrado para outro paciente');
    throw e;
  }

  if (!resultado.encontrado) throw new ErroHttp(404, 'Atendimento não encontrado');
  if (resultado.bloqueado) {
    throw new ErroHttp(
      409,
      `Não é possível alterar atendimento ${resultado.status_atendimento} (só em Aberto ou Triado)`,
    );
  }

  const atendimento = await AtendimentoRepository.findByNumero(numeroNormalizado);
  return { ...new Atendimento(atendimento), paciente: new Paciente(resultado.paciente) };
}

const COR_MANCHESTER = {
  'Emergência': 'Vermelho',
  'Muito Urgente': 'Laranja',
  'Urgente': 'Amarelo',
  'Pouco Urgente': 'Verde',
  'Não Urgente': 'Azul',
};

async function listarTriados() {
  const linhas = await AtendimentoRepository.findTriados();
  return linhas.map((linha) => ({ ...linha, cor: COR_MANCHESTER[linha.classificacao_risco] }));
}

async function painel() {
  const atendimentos = await AtendimentoRepository.findPainel();
  const resumo = { Aberto: 0, Triado: 0, Confirmado: 0, Encerrado: 0, Cancelado: 0 };
  for (const a of atendimentos) resumo[a.status_atendimento] += 1;
  return { resumo, atendimentos };
}

module.exports = {
  abrir, buscarPorNumero, buscarPorCpf, listarAbertos, listarTriados, cancelar, painel, alterar,
};
