const { eq, desc, and, ne } = require('drizzle-orm');
const { getConnection } = require('../db');
const { atendimento } = require('../db/schema');

async function findStatusAtual(idPaciente) {
  const [ultimo] = await getConnection()
    .select({ status: atendimento.status })
    .from(atendimento)
    .where(eq(atendimento.id_paciente, idPaciente))
    .orderBy(desc(atendimento.data_hora_chegada))
    .limit(1);
  return ultimo ? ultimo.status : null;
}

async function create(dados) {
  const [linha] = await getConnection().insert(atendimento).values(dados).returning();
  return linha;
}

async function findEmAndamento(idPaciente) {
  const [linha] = await getConnection()
    .select()
    .from(atendimento)
    .where(and(
      eq(atendimento.id_paciente, idPaciente),
      ne(atendimento.status, 'Finalizado'),
    ))
    .limit(1);
  return linha ?? null;
}

module.exports = { findStatusAtual, findEmAndamento, create };
