const { eq, and, asc, sql } = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, paciente } = require('../db/schema');
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
  const [atendimentoEncerrado] = await db
    .update(atendimento)
    .set({ status_atendimento: 'Encerrado', data_hora_saida: sql`now()` })
    .where(and(eq(atendimento.id_atendimento, idAtendimento), eq(atendimento.status_atendimento, statusDeOrigem('Encerrado'))))
    .returning();
  return atendimentoEncerrado ?? null;
}

module.exports = { listarAtendimentosConfirmados, passarDeConfirmadoParaEncerrado };
