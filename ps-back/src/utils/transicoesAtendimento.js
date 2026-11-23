const ErroHttp = require('./ErroHttp');

const TRANSICOES_PERMITIDAS = {
  Aberto: ['Triado', 'Cancelado'],
  Triado: ['Confirmado'],
  Confirmado: ['Encerrado'],
  Encerrado: [],
  Cancelado: [],
};

const ACAO_DA_TRANSICAO = {
  Triado: 'registrar a triagem de',
  Cancelado: 'cancelar',
  Confirmado: 'confirmar',
  Encerrado: 'dar alta em',
};

const STATUS_FINAIS = Object.keys(TRANSICOES_PERMITIDAS)
  .filter((status) => TRANSICOES_PERMITIDAS[status].length === 0);

const STATUS_COM_ALTERACAO_DE_DADOS = ['Aberto', 'Triado'];
const STATUS_SEM_ACESSO_DA_RECEPCAO = ['Confirmado', 'Encerrado'];

function transicaoPermitida(statusAtual, novoStatus) {
  return TRANSICOES_PERMITIDAS[statusAtual]?.includes(novoStatus) ?? false;
}

function statusDeOrigem(novoStatus) {
  return Object.keys(TRANSICOES_PERMITIDAS).find((status) => TRANSICOES_PERMITIDAS[status].includes(novoStatus));
}

function mensagemDeTransicaoRecusada(statusAtual, novoStatus) {
  const origem = statusDeOrigem(novoStatus);
  if (!origem) return `Um atendimento não pode voltar para ${novoStatus} (situação atual: ${statusAtual})`;
  return `Só é possível ${ACAO_DA_TRANSICAO[novoStatus]} atendimento ${origem} (situação atual: ${statusAtual})`;
}

function garantirTransicao(statusAtual, novoStatus) {
  if (!transicaoPermitida(statusAtual, novoStatus)) {
    throw new ErroHttp(409, mensagemDeTransicaoRecusada(statusAtual, novoStatus));
  }
}

function podeAlterarDados(status) {
  return STATUS_COM_ALTERACAO_DE_DADOS.includes(status);
}

function recepcaoTemAcesso(status) {
  return !STATUS_SEM_ACESSO_DA_RECEPCAO.includes(status);
}

module.exports = {
  TRANSICOES_PERMITIDAS,
  STATUS_FINAIS,
  transicaoPermitida,
  statusDeOrigem,
  mensagemDeTransicaoRecusada,
  garantirTransicao,
  podeAlterarDados,
  recepcaoTemAcesso,
};
