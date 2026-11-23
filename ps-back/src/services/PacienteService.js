const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const Paciente = require('../models/Paciente');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

const CAMPOS_TEXTO_OPCIONAL = ['rg', 'genero', 'telefone'];

function textoOpcional(valor, max) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.length <= max);
}

function limparTextoOpcional(valor) {
  if (typeof valor !== 'string') return valor;
  const textoLimpo = valor.trim();
  return textoLimpo === '' ? null : textoLimpo;
}

function normalizarDadosPaciente(dados) {
  const normalizado = { ...dados };
  if (typeof normalizado.nome === 'string') normalizado.nome = normalizado.nome.trim();
  for (const campo of CAMPOS_TEXTO_OPCIONAL) {
    if (campo in normalizado) normalizado[campo] = limparTextoOpcional(normalizado[campo]);
  }
  return normalizado;
}

const nomeValido = (v) => typeof v === 'string' && v.length >= 1 && v.length <= 100;
const cpfValido = (v) => typeof v === 'string' && /^\d{11}$/.test(v);

function dataDeHoje() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

function dataExiste(texto) {
  const data = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

const dataValida = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
  && v >= '1900-01-01' && dataExiste(v) && v <= dataDeHoje();

function validarOpcionais(p) {
  if (!textoOpcional(p.rg, 15)) return 'RG inválido';
  if (!textoOpcional(p.genero, 20)) return 'Gênero inválido';
  if (!textoOpcional(p.telefone, 15)) return 'Telefone inválido';
  return null;
}

function validar(p) {
  if (!nomeValido(p.nome)) return 'Nome inválido';
  if (!cpfValido(p.cpf)) return 'CPF deve ter 11 números';
  if (!dataValida(p.data_nascimento)) return 'Data de nascimento inválida (use AAAA-MM-DD, entre 1900 e hoje)';
  return validarOpcionais(p);
}

function validarAlteracao(p) {
  if ('nome' in p && !nomeValido(p.nome)) return 'Nome inválido';
  if ('cpf' in p && !cpfValido(p.cpf)) return 'CPF deve ter 11 números';
  if ('data_nascimento' in p && !dataValida(p.data_nascimento)) return 'Data de nascimento inválida (use AAAA-MM-DD, entre 1900 e hoje)';
  return validarOpcionais(p);
}

async function listar() {
  const linhas = await PacienteRepository.findAll();
  return linhas.map((linha) => new Paciente(linha));
}

async function buscarPorCpf(cpf) {
  const linha = await PacienteRepository.findByCpf(cpf);
  if (!linha) throw new ErroHttp(404, 'Paciente não encontrado');
  const status = await AtendimentoRepository.findStatusAtual(linha.id_paciente);
  return new Paciente({ ...linha, status });
}

async function cadastrar(dados) {
  const dadosLimpos = normalizarDadosPaciente(dados);
  const erro = validar(dadosLimpos);
  if (erro) throw new ErroHttp(422, erro);

  const novo = new Paciente(dadosLimpos);
  try {
    return new Paciente(await PacienteRepository.create(novo.paraInsercao()));
  } catch (e) {
    if (codigoPg(e) === '23505') throw new ErroHttp(409, 'CPF já cadastrado');
    throw e;
  }
}

async function contar() {
  return PacienteRepository.count();
}

async function atualizarPorCpf(cpfAtual, dadosRecebidos) {
  if (!/^\d{11}$/.test(cpfAtual)) throw new ErroHttp(422, 'CPF deve ter 11 números');
  if (dadosRecebidos === null || typeof dadosRecebidos !== 'object' || Array.isArray(dadosRecebidos)) {
    throw new ErroHttp(422, 'Envie os dados a alterar em um objeto JSON');
  }

  const camposPermitidos = ['nome', 'cpf', 'data_nascimento', 'rg', 'genero', 'telefone'];
  const campoNaoPermitido = Object.keys(dadosRecebidos).find((campo) => !camposPermitidos.includes(campo));
  if (campoNaoPermitido) throw new ErroHttp(422, `Campo não pode ser alterado: ${campoNaoPermitido}`);
  if (Object.keys(dadosRecebidos).length === 0) throw new ErroHttp(422, 'Informe ao menos um campo para alterar');

  const dadosLimpos = normalizarDadosPaciente(dadosRecebidos);
  const erro = validarAlteracao(dadosLimpos);
  if (erro) throw new ErroHttp(422, erro);

  try {
    const atualizada = await PacienteRepository.updateByCpf(cpfAtual, dadosLimpos);
    if (!atualizada) throw new ErroHttp(404, 'Paciente não encontrado');
    return new Paciente(atualizada);
  } catch (e) {
    if (codigoPg(e) === '23505') throw new ErroHttp(409, 'CPF já cadastrado para outro paciente');
    throw e;
  }
}

module.exports = {
  listar, buscarPorCpf, cadastrar, contar, atualizarPorCpf, validarAlteracao, normalizarDadosPaciente, limparTextoOpcional,
};
