const AutenticacaoService = require('../services/AutenticacaoService');

async function login(req, res) {
  res.json(await AutenticacaoService.entrar(req.body));
}

async function eu(req, res) {
  res.json(await AutenticacaoService.buscarProfissionalLogado(req.usuario));
}

module.exports = { login, eu };
