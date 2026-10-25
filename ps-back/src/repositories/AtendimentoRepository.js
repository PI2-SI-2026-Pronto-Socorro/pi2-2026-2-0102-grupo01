const { eq, desc } = require('drizzle-orm');
const { getConnection } = require('../db');
const { atendimento } = require('../db/schema');
const Atendimento = require('../models/Atendimento');

async function findStatusAtual(idPaciente) {
  const [ultimo] = await getConnection()
    .select({ status: atendimento.status })
    .from(atendimento)
    .where(eq(atendimento.id_paciente, idPaciente))
    .orderBy(desc(atendimento.data_hora_chegada))
    .limit(1);
  return ultimo ? ultimo.status : null;
}

async function create(novoAtendimento) {
  const [linha] = await getConnection().insert(atendimento).values(novoAtendimento.paraInsercao()).returning();
  return new Atendimento(linha);
}

module.exports = { findStatusAtual, create };
