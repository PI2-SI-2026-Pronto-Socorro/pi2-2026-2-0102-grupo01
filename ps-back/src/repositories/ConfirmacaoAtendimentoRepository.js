const { eq, and, count } = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, consultaMedica, prescricao, prescricaoMedicacao } = require('../db/schema');

async function contarMedicacoesDoAtendimento(idAtendimento) {
  const [resultadoContagem] = await db
    .select({ quantidadeMedicacoes: count() })
    .from(consultaMedica)
    .innerJoin(prescricao, eq(prescricao.id_consulta, consultaMedica.id_consulta))
    .innerJoin(prescricaoMedicacao, eq(prescricaoMedicacao.id_prescricao, prescricao.id_prescricao))
    .where(eq(consultaMedica.id_atendimento, idAtendimento));
  return Number(resultadoContagem.quantidadeMedicacoes);
}

async function passarDeTriadoParaConfirmado(idAtendimento) {
  const [atendimentoConfirmado] = await db
    .update(atendimento)
    .set({ status_atendimento: 'Confirmado' })
    .where(and(eq(atendimento.id_atendimento, idAtendimento), eq(atendimento.status_atendimento, 'Triado')))
    .returning();
  return atendimentoConfirmado ?? null;
}

module.exports = { contarMedicacoesDoAtendimento, passarDeTriadoParaConfirmado };
