const { eq, desc } = require('drizzle-orm');
const db = require('../config/db');
const { atendimento } = require('./schema');

async function statusAtual(idPaciente) {
  const [ultimo] = await db
    .select({ status: atendimento.status })
    .from(atendimento)
    .where(eq(atendimento.id_paciente, idPaciente))
    .orderBy(desc(atendimento.data_hora_chegada))
    .limit(1);
  return ultimo ? ultimo.status : null;
}

async function criar(dados) {
  const [novo] = await db.insert(atendimento).values(dados).returning();
  return novo;
}

module.exports = { statusAtual, criar };
