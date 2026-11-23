const {
  eq, and, asc, isNull, sql,
} = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, paciente, consultaMedica } = require('../db/schema');
const { statusDeOrigem } = require('../utils/transicoesAtendimento');

async function listarAtendimentosConfirmados() {
  return db
    .select({
      numero_atendimento: atendimento.numero_atendimento,
      nome: paciente.nome,
      cpf: paciente.cpf,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.status_atendimento, 'Confirmado'))
    .orderBy(asc(atendimento.data_hora_chegada));
}

async function passarDeConfirmadoParaEncerrado(idAtendimento) {
  return db.transaction(async (transacao) => {
    const [atendimentoEncerrado] = await transacao
      .update(atendimento)
      .set({ status_atendimento: 'Encerrado', data_hora_saida: sql`now()` })
      .where(and(eq(atendimento.id_atendimento, idAtendimento), eq(atendimento.status_atendimento, statusDeOrigem('Encerrado'))))
      .returning();
    if (!atendimentoEncerrado) return null;

    await transacao
      .update(consultaMedica)
      .set({ data_hora_fim: sql`now()` })
      .where(and(eq(consultaMedica.id_atendimento, idAtendimento), isNull(consultaMedica.data_hora_fim)));
    return atendimentoEncerrado;
  });
}

module.exports = { listarAtendimentosConfirmados, passarDeConfirmadoParaEncerrado };
