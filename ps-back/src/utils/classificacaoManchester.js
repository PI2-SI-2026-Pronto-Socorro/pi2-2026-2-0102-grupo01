const CLASSIFICACOES_MANCHESTER = [
  { classificacao: 'Emergência', prioridade: 1, cor: 'Vermelho' },
  { classificacao: 'Muito Urgente', prioridade: 2, cor: 'Laranja' },
  { classificacao: 'Urgente', prioridade: 3, cor: 'Amarelo' },
  { classificacao: 'Pouco Urgente', prioridade: 4, cor: 'Verde' },
  { classificacao: 'Não Urgente', prioridade: 5, cor: 'Azul' },
];

function corDaClassificacao(classificacao) {
  return CLASSIFICACOES_MANCHESTER.find((item) => item.classificacao === classificacao)?.cor ?? null;
}

module.exports = { CLASSIFICACOES_MANCHESTER, corDaClassificacao };
