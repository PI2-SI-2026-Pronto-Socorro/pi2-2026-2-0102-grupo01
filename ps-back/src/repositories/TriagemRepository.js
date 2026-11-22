const { eq, and } = require('drizzle-orm');
const { db } = require('../db');
const { triagem, queixa, atendimento } = require('../db/schema');
const { travarAtendimentoEBuscarStatus } = require('./AtendimentoRepository');
const { transicaoPermitida, statusDeOrigem } = require('../utils/transicoesAtendimento');

async function criarTriagemComQueixas(dadosTriagem, listaQueixas) {
  return db.transaction(async (transacao) => {
    const statusAtualDoAtendimento = await travarAtendimentoEBuscarStatus(transacao, dadosTriagem.id_atendimento);
    if (!transicaoPermitida(statusAtualDoAtendimento, 'Triado')) return { gravado: false, statusAtualDoAtendimento };

    const [triagemCriada] = await transacao.insert(triagem).values(dadosTriagem).returning();

    const queixasCriadas = listaQueixas.length
      ? await transacao.insert(queixa)
        .values(listaQueixas.map((dadosQueixa) => ({ ...dadosQueixa, id_triagem: triagemCriada.id_triagem })))
        .returning()
      : [];

    await transacao.update(atendimento)
      .set({ status_atendimento: 'Triado' })
      .where(and(eq(atendimento.id_atendimento, dadosTriagem.id_atendimento), eq(atendimento.status_atendimento, statusDeOrigem('Triado'))));

    return { gravado: true, triagemGravada: { ...triagemCriada, queixas: queixasCriadas } };
  });
}

module.exports = { criarTriagemComQueixas };
