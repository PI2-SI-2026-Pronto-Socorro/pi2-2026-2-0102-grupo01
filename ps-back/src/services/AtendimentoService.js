const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const PacienteService = require('./PacienteService');
const Atendimento = require('../models/Atendimento');
const Paciente = require('../models/Paciente');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');
const { corDaClassificacao } = require('../utils/classificacaoManchester');
const ProfissionalRepository = require('../repositories/ProfissionalRepository');
const {
  TRANSICOES_PERMITIDAS, mensagemDeTransicaoRecusada, podeAlterarDados, recepcaoTemAcesso, statusDeOrigem,
} = require('../utils/transicoesAtendimento');
const { autenticacaoObrigatoria, RECEPCAO, MEDICO } = require('../middlewares/autenticacao');

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
  throw new ErroHttp(409, mensagemDeTransicaoRecusada(atual.status_atendimento, 'Cancelado'));
}

const STATUS_SEM_ALTERACAO = Object.keys(TRANSICOES_PERMITIDAS).filter((status) => !podeAlterarDados(status));
const { CAMPOS_PACIENTE } = PacienteService;
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
  const camposPaciente = {};
  for (const campo of campos) {
    (CAMPOS_ATENDIMENTO.includes(campo) ? dadosAtendimento : camposPaciente)[campo] = dados[campo];
  }

  if ('motivo_atendimento' in dadosAtendimento) {
    const motivo = PacienteService.limparTextoOpcional(dadosAtendimento.motivo_atendimento);
    if (motivo !== null && (typeof motivo !== 'string' || motivo.length > 255)) {
      throw new ErroHttp(422, 'Motivo do atendimento inválido (até 255 caracteres)');
    }
    dadosAtendimento.motivo_atendimento = motivo;
  }

  const dadosPaciente = PacienteService.normalizarDadosPaciente(camposPaciente);
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

  return { ...new Atendimento(resultado.atendimento), paciente: new Paciente(resultado.paciente) };
}

const NOME_PADRAO_NAO_IDENTIFICADO = 'Paciente não identificado';
const CAMPOS_PROIBIDOS_SEM_DOCUMENTO = ['cpf', 'rg'];

async function abrirNaoIdentificado(dados = {}) {
  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroHttp(422, 'Envie os dados em um objeto JSON');
  }
  const campoComDocumento = CAMPOS_PROIBIDOS_SEM_DOCUMENTO.find((campo) => dados[campo]);
  if (campoComDocumento) {
    throw new ErroHttp(422, 'Paciente com CPF ou RG deve ser cadastrado pelo fluxo normal (POST /api/pacientes)');
  }

  const camposPaciente = {};
  for (const campo of ['nome', 'data_nascimento', 'genero', 'telefone']) {
    if (dados[campo] !== undefined && dados[campo] !== null && dados[campo] !== '') camposPaciente[campo] = dados[campo];
  }
  const dadosPaciente = PacienteService.normalizarDadosPaciente(camposPaciente);
  const erroPaciente = PacienteService.validarAlteracao(dadosPaciente);
  if (erroPaciente) throw new ErroHttp(422, erroPaciente);
  dadosPaciente.nome = dadosPaciente.nome || NOME_PADRAO_NAO_IDENTIFICADO;

  const motivo = PacienteService.limparTextoOpcional(dados.motivo_atendimento);
  if (motivo !== null && motivo !== undefined && (typeof motivo !== 'string' || motivo.length > 255)) {
    throw new ErroHttp(422, 'Motivo do atendimento inválido (até 255 caracteres)');
  }

  const criado = await AtendimentoRepository.abrirParaPacienteNaoIdentificado(
    { ...dadosPaciente, cpf: null, rg: null },
    { status_atendimento: 'Aberto', motivo_atendimento: motivo ?? null },
  );
  return { ...new Atendimento(criado.atendimento), paciente: new Paciente(criado.paciente) };
}

async function identificarMedico(usuario, corpo) {
  const idMedico = usuario?.id_profissional ?? corpo?.id_profissional;
  if (typeof idMedico !== 'string' || !UUID.test(idMedico)) throw new ErroHttp(422, 'id_profissional inválido');
  const medico = await ProfissionalRepository.buscarPorId(idMedico);
  if (!medico) throw new ErroHttp(404, 'Profissional não existe');
  if (medico.perfil !== MEDICO) throw new ErroHttp(403, 'Só um profissional com perfil Médico pode abrir o atendimento');
  return medico;
}

async function reservar(numero, usuario, corpo) {
  const numeroNormalizado = normalizarNumero(numero);
  const medico = await identificarMedico(usuario, corpo);

  const reservado = await AtendimentoRepository.reservarParaMedico(numeroNormalizado, medico.id_profissional);
  if (reservado) {
    return { ...new Atendimento(reservado), medico_responsavel: medico.nome };
  }

  const atual = await AtendimentoRepository.findReserva(numeroNormalizado);
  if (!atual) throw new ErroHttp(404, 'Atendimento não encontrado');
  const statusEsperado = statusDeOrigem('Confirmado');
  if (atual.status_atendimento !== statusEsperado) {
    throw new ErroHttp(409, `Só é possível abrir atendimento ${statusEsperado} (situação atual: ${atual.status_atendimento})`);
  }
  throw new ErroHttp(409, `Atendimento já está com ${atual.nome_profissional ?? 'outro médico'}`);
}

function garantirAcessoDaRecepcao(usuario, status) {
  if (!autenticacaoObrigatoria() || usuario?.perfil !== RECEPCAO) return;
  if (!recepcaoTemAcesso(status)) {
    throw new ErroHttp(403, `A recepção não tem mais acesso a este atendimento (situação: ${status})`);
  }
}

async function listarTriados() {
  const linhas = await AtendimentoRepository.findTriados();
  return linhas.map((linha) => ({ ...linha, cor: corDaClassificacao(linha.classificacao_risco) }));
}

module.exports = {
  abrir, buscarPorNumero, buscarPorCpf, listarAbertos, listarTriados, cancelar, alterar,
  abrirNaoIdentificado, reservar, garantirAcessoDaRecepcao,
};
