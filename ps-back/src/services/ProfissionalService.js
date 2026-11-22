const ProfissionalRepository = require('../repositories/ProfissionalRepository');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');
const { cpfComDigitosValidos } = require('../utils/cpf');
const { gerarHashSenha } = require('../utils/senha');

const CARGOS = ['Médico', 'Enfermeiro', 'Técnico de Enfermagem', 'Recepcionista', 'Outro'];
const PERFIS = ['Recepção', 'Enfermagem', 'Médico'];
const PERFIL_DO_CARGO = {
  Médico: 'Médico',
  Enfermeiro: 'Enfermagem',
  'Técnico de Enfermagem': 'Enfermagem',
  Recepcionista: 'Recepção',
};
const MENSAGEM_DE_DUPLICIDADE = {
  uk_profissional_cpf: 'CPF já cadastrado para outro profissional',
  uk_profissional_usuario: 'Usuário já está em uso',
  uk_profissional_registro: 'Registro profissional já cadastrado',
};

function textoObrigatorio(valor, nomeExibido, maximo) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) throw new ErroHttp(422, `${nomeExibido} é obrigatório`);
  if (texto.length > maximo) throw new ErroHttp(422, `${nomeExibido} deve ter até ${maximo} caracteres`);
  return texto;
}

function textoOpcional(valor, nomeExibido, maximo) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') throw new ErroHttp(422, `${nomeExibido} inválido`);
  const texto = valor.trim();
  if (texto.length > maximo) throw new ErroHttp(422, `${nomeExibido} deve ter até ${maximo} caracteres`);
  return texto || null;
}

function validarProfissional(dados) {
  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroHttp(422, 'Envie os dados do profissional em um objeto JSON');
  }

  const nome = textoObrigatorio(dados.nome, 'Nome', 100);
  if (!/\p{L}.*\p{L}/u.test(nome)) throw new ErroHttp(422, 'Nome inválido');

  const cpf = typeof dados.cpf === 'string' ? dados.cpf.replace(/\D/g, '') : '';
  if (!cpfComDigitosValidos(cpf)) throw new ErroHttp(422, 'CPF inválido');

  if (!CARGOS.includes(dados.cargo)) throw new ErroHttp(422, `Cargo deve ser um de: ${CARGOS.join(', ')}`);
  if (!PERFIS.includes(dados.perfil)) throw new ErroHttp(422, `Perfil deve ser um de: ${PERFIS.join(', ')}`);
  const perfilEsperado = PERFIL_DO_CARGO[dados.cargo];
  if (perfilEsperado && perfilEsperado !== dados.perfil) {
    throw new ErroHttp(422, `O cargo ${dados.cargo} usa o perfil ${perfilEsperado}`);
  }

  const usuario = textoObrigatorio(dados.usuario, 'Usuário', 50).toLowerCase();
  if (!/^[a-z0-9._-]{3,50}$/.test(usuario)) {
    throw new ErroHttp(422, 'Usuário deve ter de 3 a 50 caracteres: letras sem acento, números, ponto, hífen ou sublinhado');
  }

  if (typeof dados.senha !== 'string' || dados.senha.length < 8 || dados.senha.length > 72) {
    throw new ErroHttp(422, 'A senha deve ter de 8 a 72 caracteres');
  }
  if (!/\p{L}/u.test(dados.senha) || !/\d/.test(dados.senha)) {
    throw new ErroHttp(422, 'A senha deve ter letras e números');
  }

  const registro = textoOpcional(dados.registro_profissional, 'Registro profissional', 25);
  if (dados.perfil === 'Médico' && !registro) throw new ErroHttp(422, 'Informe o CRM do médico');

  return {
    nome,
    cpf,
    cargo: dados.cargo,
    perfil: dados.perfil,
    usuario,
    senha: dados.senha,
    registro_profissional: registro,
    telefone: textoOpcional(dados.telefone, 'Telefone', 15),
    especialidade: textoOpcional(dados.especialidade, 'Especialidade', 80),
    plantao: textoOpcional(dados.plantao, 'Plantão', 50),
  };
}

async function listarProfissionais() {
  return ProfissionalRepository.listarProfissionaisPorNome();
}

async function cadastrarProfissional(dados) {
  const { senha, ...profissionalValido } = validarProfissional(dados);
  const senha_hash = await gerarHashSenha(senha);
  try {
    return await ProfissionalRepository.cadastrar({ ...profissionalValido, senha_hash });
  } catch (erro) {
    if (codigoPg(erro) === '23505') {
      const restricao = (erro.cause ?? erro).constraint;
      throw new ErroHttp(409, MENSAGEM_DE_DUPLICIDADE[restricao] ?? 'Profissional já cadastrado');
    }
    throw erro;
  }
}

module.exports = { listarProfissionais, cadastrarProfissional, PERFIS };
