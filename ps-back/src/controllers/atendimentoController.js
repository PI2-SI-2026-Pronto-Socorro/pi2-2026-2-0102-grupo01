const AtendimentoService = require('../services/AtendimentoService');

async function create(req, res) {
  const novo = await AtendimentoService.abrir(req.body || {});
  res.status(201).json(novo);
}

async function findByNumero(req, res) {
  const encontrado = await AtendimentoService.buscarPorNumero(req.params.numero);
  AtendimentoService.garantirAcessoDaRecepcao(req.usuario, encontrado.status_atendimento);
  res.json(encontrado);
}

async function abrirNaoIdentificado(req, res) {
  res.status(201).json(await AtendimentoService.abrirNaoIdentificado(req.body ?? {}));
}

async function reservar(req, res) {
  res.json(await AtendimentoService.reservar(req.params.numero, req.usuario, req.body));
}

async function findByCpf(req, res) {
  res.json(await AtendimentoService.buscarPorCpf(req.query.cpf ?? '', req.usuario));
}

async function findTodos(req, res) {
  res.json(await AtendimentoService.listarTodos(req.usuario));
}

async function findAbertos(req, res) {
  res.json(await AtendimentoService.listarAbertos());
}

async function cancelar(req, res) {
  res.json(await AtendimentoService.cancelar(req.params.numero));
}

async function alterar(req, res) {
  res.json(await AtendimentoService.alterar(req.params.numero, req.body));
}

async function findTriados(req, res) {
  res.json(await AtendimentoService.listarTriados());
}

module.exports = {
  create, findByNumero, findByCpf, findTodos, findAbertos, findTriados, cancelar, alterar, abrirNaoIdentificado, reservar,
};
