const pacienteModel = require('../models/pacienteModel');
const atendimentoModel = require('../models/atendimentoModel');

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

async function listar(req, res) {
  res.json(await pacienteModel.listar());
}

async function buscarPorCpf(req, res) {
  const encontrado = await pacienteModel.buscarPorCpf(req.params.cpf);
  if (!encontrado) return res.status(404).json({ detail: 'Paciente não encontrado' });
  res.json({ ...encontrado, status: await atendimentoModel.statusAtual(encontrado.id_paciente) });
}

async function criar(req, res) {
  const body = req.body || {};
  const erro = validarPaciente(body);
  if (erro) return res.status(422).json({ detail: erro });

  try {
    const novo = await pacienteModel.criar({
      nome: body.nome,
      cpf: body.cpf,
      data_nascimento: body.data_nascimento,
      genero: body.genero ?? null,
      telefone: body.telefone ?? null,
    });
    res.status(201).json(novo);
  } catch (e) {
    if ((e.cause ?? e).code === '23505') return res.status(409).json({ detail: 'CPF já cadastrado' });
    throw e;
  }
}

module.exports = { listar, buscarPorCpf, criar };
