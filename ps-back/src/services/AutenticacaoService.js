const ProfissionalRepository = require('../repositories/ProfissionalRepository');
const ErroHttp = require('../utils/ErroHttp');
const { senhaConfere } = require('../utils/senha');
const { gerarToken } = require('../utils/token');

const MENSAGEM_LOGIN_INVALIDO = 'Usuário ou senha inválidos';

async function entrar(dados) {
  const usuario = typeof dados?.usuario === 'string' ? dados.usuario.trim().toLowerCase() : '';
  const senha = typeof dados?.senha === 'string' ? dados.senha : '';
  if (!usuario || !senha) throw new ErroHttp(422, 'Informe o usuário e a senha');

  const encontrado = await ProfissionalRepository.buscarPorUsuario(usuario);
  const senhaCorreta = await senhaConfere(senha, encontrado?.senha_hash);
  if (!encontrado || !senhaCorreta) {
    throw new ErroHttp(401, MENSAGEM_LOGIN_INVALIDO);
  }

  const { token, expira_em } = gerarToken({
    id_profissional: encontrado.id_profissional,
    perfil: encontrado.perfil,
  });
  return {
    token,
    expira_em,
    profissional: {
      id_profissional: encontrado.id_profissional,
      nome: encontrado.nome,
      cargo: encontrado.cargo,
      perfil: encontrado.perfil,
    },
  };
}

async function buscarProfissionalLogado(usuarioDoToken) {
  if (!usuarioDoToken) throw new ErroHttp(401, 'Faça login para continuar');
  const profissional = await ProfissionalRepository.buscarPorId(usuarioDoToken.id_profissional);
  if (!profissional) throw new ErroHttp(401, 'Faça login para continuar');
  return profissional;
}

module.exports = { entrar, buscarProfissionalLogado };
