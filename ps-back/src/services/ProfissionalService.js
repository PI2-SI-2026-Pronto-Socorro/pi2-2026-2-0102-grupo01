const crypto = require('crypto');
const ProfissionalRepository = require('../repositories/ProfissionalRepository');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

const CARGOS = {
  medico: 'Médico',
  enfermeiro: 'Enfermeiro',
  tecnico: 'Técnico de Enfermagem',
  recepcionista: 'Recepcionista',
  outro: 'Outro',
};

const PERFIS = {
  recepcao: 'Recepção',
  enfermagem: 'Enfermagem',
  medico: 'Médico',
};

function gerarSenhaHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function listarProfissionais() {
  return ProfissionalRepository.listarProfissionaisPorNome();
}

async function cadastrar(dadosRecebidos) {
  const dados = dadosRecebidos || {};
  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
  const cpf = typeof dados.cpf === 'string' ? dados.cpf.replace(/\D/g, '') : '';
  const telefone = typeof dados.telefone === 'string' ? dados.telefone.trim() || null : null;
  const registro = typeof dados.registro_profissional === 'string' ? dados.registro_profissional.trim() || null : null;
  const especialidade = typeof dados.especialidade === 'string' ? dados.especialidade.trim() || null : null;
  const plantao = typeof dados.plantao === 'string' ? dados.plantao.trim() || null : null;
  const usuario = typeof dados.usuario === 'string' ? dados.usuario.trim() : '';
  const senha = typeof dados.senha === 'string' ? dados.senha : '';

  if (nome.length < 3 || nome.length > 100) throw new ErroHttp(422, 'Nome do profissional inválido');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) throw new ErroHttp(422, 'CPF inválido');
  if (!CARGOS[dados.cargo]) throw new ErroHttp(422, 'Cargo inválido');
  if (!PERFIS[dados.perfil]) throw new ErroHttp(422, 'Perfil de acesso inválido');
  if (usuario.length < 3 || usuario.length > 50) throw new ErroHttp(422, 'Usuário deve ter entre 3 e 50 caracteres');
  if (senha.length < 6 || senha.length > 255) throw new ErroHttp(422, 'Senha deve ter pelo menos 6 caracteres');
  if (telefone && telefone.length > 15) throw new ErroHttp(422, 'Telefone inválido');
  if (registro && registro.length > 25) throw new ErroHttp(422, 'Registro profissional inválido');
  if (especialidade && especialidade.length > 80) throw new ErroHttp(422, 'Especialidade inválida');
  if (plantao && plantao.length > 50) throw new ErroHttp(422, 'Plantão inválido');

  try {
    const criado = await ProfissionalRepository.create({
      nome,
      cpf,
      telefone,
      cargo: CARGOS[dados.cargo],
      registro_profissional: registro,
      especialidade,
      plantao,
      perfil: PERFIS[dados.perfil],
      usuario,
      senha_hash: gerarSenhaHash(senha),
    });
    return {
      id_profissional: criado.id_profissional,
      nome: criado.nome,
      cargo: criado.cargo,
      perfil: criado.perfil,
      usuario: criado.usuario,
    };
  } catch (erro) {
    if (codigoPg(erro) === '23505') throw new ErroHttp(409, 'CPF, registro profissional ou usuário já cadastrado');
    throw erro;
  }
}

module.exports = { listarProfissionais, cadastrar };
