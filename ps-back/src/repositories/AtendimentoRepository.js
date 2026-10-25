const { eq, desc } = require('drizzle-orm');
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

module.exports = { findStatusAtual, create };
