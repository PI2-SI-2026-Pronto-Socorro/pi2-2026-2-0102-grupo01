const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const Paciente = require('../models/Paciente');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

function textoOpcional(valor, max) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.length <= max);
}

function validar(p) {
  if (typeof p.nome !== 'string' || p.nome.length < 1 || p.nome.length > 100) return 'Nome inválido';
  if (typeof p.cpf !== 'string' || !/^\d{11}$/.test(p.cpf)) return 'CPF deve ter 11 números';
  if (typeof p.data_nascimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.data_nascimento)
      || isNaN(new Date(p.data_nascimento))) return 'Data de nascimento inválida (use AAAA-MM-DD)';
  if (!textoOpcional(p.rg, 15)) return 'RG inválido';
  if (!textoOpcional(p.genero, 20)) return 'Gênero inválido';
  if (!textoOpcional(p.telefone, 15)) return 'Telefone inválido';
  return null;
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
  const erro = validar(dados);
  if (erro) throw new ErroHttp(422, erro);

  const novo = new Paciente(dados);
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

module.exports = { listar, buscarPorCpf, cadastrar, contar };
