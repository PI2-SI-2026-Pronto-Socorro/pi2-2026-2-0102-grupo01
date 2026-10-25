const { eq, count } = require('drizzle-orm');
const { getConnection } = require('../db');
const { paciente } = require('../db/schema');

async function findAll() {
  return getConnection().select().from(paciente);
}

async function findByCpf(cpf) {
  const [linha] = await getConnection().select().from(paciente).where(eq(paciente.cpf, cpf));
  return linha ?? null;
}

async function exists(idPaciente) {
  const [linha] = await getConnection().select({ id: paciente.id_paciente }).from(paciente)
    .where(eq(paciente.id_paciente, idPaciente));
  return Boolean(linha);
}

async function countAll() {
  const [{ total }] = await getConnection().select({ total: count() }).from(paciente);
  return total;
}

async function create(dados) {
  const [linha] = await getConnection().insert(paciente).values(dados).returning();
  return linha;
}

module.exports = { findAll, findByCpf, exists, count: countAll, create };
