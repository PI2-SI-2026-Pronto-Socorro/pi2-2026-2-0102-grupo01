const PacienteRepository = require('../repositories/PacienteRepository');
const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const Paciente = require('../models/Paciente');
const { codigoPg } = require('../utils/pgHelpers');

function textoOpcional(valor, max) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.length <= max);
}

function validarPaciente(p) {
  if (typeof p.nome !== 'string' || p.nome.length < 1 || p.nome.length > 100) return 'Nome inválido';
  if (typeof p.cpf !== 'string' || !/^\d{11}$/.test(p.cpf)) return 'CPF deve ter 11 números';
  if (typeof p.data_nascimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.data_nascimento)
      || isNaN(new Date(p.data_nascimento))) return 'Data de nascimento inválida (use AAAA-MM-DD)';
  if (!textoOpcional(p.genero, 20)) return 'Gênero inválido';
  if (!textoOpcional(p.telefone, 15)) return 'Telefone inválido';
  return null;
}

async function findAll(req, res) {
  res.json(await PacienteRepository.findAll());
}

async function findOne(req, res) {
  const encontrado = await PacienteRepository.findByCpf(req.params.cpf);
  if (!encontrado) return res.status(404).json({ detail: 'Paciente não encontrado' });
  encontrado.status = await AtendimentoRepository.findStatusAtual(encontrado.id_paciente);
  res.json(encontrado);
}

async function create(req, res) {
  const body = req.body || {};
  const erro = validarPaciente(body);
  if (erro) return res.status(422).json({ detail: erro });

  try {
    const novo = await PacienteRepository.create(new Paciente(body));
    res.status(201).json(novo);
  } catch (e) {
    if (codigoPg(e) === '23505') return res.status(409).json({ detail: 'CPF já cadastrado' });
    throw e;
  }
}

module.exports = { findAll, findOne, create };
