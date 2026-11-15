const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { triagem, queixa, atendimento } = require('../db/schema');

async function criarTriagemComQueixas(dadosTriagem, listaQueixas) {
  return db.transaction(async (transacao) => {
    const [triagemCriada] = await transacao.insert(triagem).values(dadosTriagem).returning();

    const queixasCriadas = listaQueixas.length
      ? await transacao.insert(queixa)
        .values(listaQueixas.map((dadosQueixa) => ({ ...dadosQueixa, id_triagem: triagemCriada.id_triagem })))
        .returning()
      : [];

    await transacao.update(atendimento)
      .set({ status_atendimento: 'Triado' })
      .where(eq(atendimento.id_atendimento, dadosTriagem.id_atendimento));

    return { ...triagemCriada, queixas: queixasCriadas };
  });
}

module.exports = { criarTriagemComQueixas };
