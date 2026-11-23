const {
  eq, and, or, isNull, count,
} = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, consultaMedica, prescricao, prescricaoMedicacao } = require('../db/schema');
const { statusDeOrigem } = require('../utils/transicoesAtendimento');

async function contarMedicacoesDoAtendimento(idAtendimento) {
  const [resultadoContagem] = await db
    .select({ quantidadeMedicacoes: count() })
    .from(consultaMedica)
    .innerJoin(prescricao, eq(prescricao.id_consulta, consultaMedica.id_consulta))
    .innerJoin(prescricaoMedicacao, eq(prescricaoMedicacao.id_prescricao, prescricao.id_prescricao))
    .where(eq(consultaMedica.id_atendimento, idAtendimento));
  return Number(resultadoContagem.quantidadeMedicacoes);
}

async function passarDeTriadoParaConfirmado(idAtendimento, idMedico) {
  const atendimentoDoMedico = idMedico
    ? or(isNull(atendimento.id_profissional), eq(atendimento.id_profissional, idMedico))
    : undefined;
  const [atendimentoConfirmado] = await db
    .update(atendimento)
    .set({ status_atendimento: 'Confirmado' })
    .where(and(
      eq(atendimento.id_atendimento, idAtendimento),
      eq(atendimento.status_atendimento, statusDeOrigem('Confirmado')),
      atendimentoDoMedico,
    ))
    .returning();
  return atendimentoConfirmado ?? null;
}

module.exports = { contarMedicacoesDoAtendimento, passarDeTriadoParaConfirmado };
