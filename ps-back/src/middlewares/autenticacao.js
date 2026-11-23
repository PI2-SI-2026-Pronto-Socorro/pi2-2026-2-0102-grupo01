const { lerToken } = require('../utils/token');

const RECEPCAO = 'Recepção';
const ENFERMAGEM = 'Enfermagem';
const MEDICO = 'Médico';
const TODOS_OS_PERFIS = [RECEPCAO, ENFERMAGEM, MEDICO];

function autenticacaoObrigatoria() {
  return process.env.AUTH_OBRIGATORIA === 'true';
}

function identificarUsuario(req, res, next) {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  req.usuario = tipo === 'Bearer' ? lerToken(token) : null;
  next();
}

function exigirPerfil(...perfisPermitidos) {
  return (req, res, next) => {
    if (!autenticacaoObrigatoria()) return next();
    if (!req.usuario) return res.status(401).json({ detail: 'Faça login para continuar' });
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ detail: `Esta operação não é permitida para o perfil ${req.usuario.perfil}` });
    }
    return next();
  };
}

function corpoComProfissionalLogado(req) {
  const corpo = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (!autenticacaoObrigatoria() || !req.usuario) return corpo;
  return { ...corpo, id_profissional: req.usuario.id_profissional };
}

function exigirLogin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ detail: 'Faça login para continuar' });
  return next();
}

module.exports = {
  RECEPCAO, ENFERMAGEM, MEDICO, TODOS_OS_PERFIS, autenticacaoObrigatoria, identificarUsuario, exigirPerfil, exigirLogin,
  corpoComProfissionalLogado,
};
