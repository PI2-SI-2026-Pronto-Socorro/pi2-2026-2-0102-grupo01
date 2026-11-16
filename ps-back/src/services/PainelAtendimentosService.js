const PainelAtendimentosRepository = require('../repositories/PainelAtendimentosRepository');

const STATUS_CONTADOS_NO_PAINEL = ['Aberto', 'Triado', 'Confirmado', 'Encerrado'];

async function montarPainelAtendimentos() {
  const [atendimentosDoPainel, contagemPorStatus] = await Promise.all([
    PainelAtendimentosRepository.listarAtendimentosDoPainel(),
    PainelAtendimentosRepository.contarAtendimentosDoDiaPorStatus(),
  ]);

  const totaisDoDia = Object.fromEntries(STATUS_CONTADOS_NO_PAINEL.map((nomeStatus) => [nomeStatus, 0]));
  for (const { status_atendimento: nomeStatus, quantidade } of contagemPorStatus) {
    if (nomeStatus in totaisDoDia) totaisDoDia[nomeStatus] = Number(quantidade);
  }

  return { totais_do_dia: totaisDoDia, atendimentos: atendimentosDoPainel };
}

module.exports = { montarPainelAtendimentos };
