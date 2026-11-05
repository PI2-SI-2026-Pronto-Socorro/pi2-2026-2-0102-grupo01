const { eq, count } = require('drizzle-orm');
const { db } = require('../db');
const { paciente } = require('../db/schema');

async function findAll() {
  return db.select().from(paciente);
}

async function findByCpf(cpf) {
  const [linha] = await db.select().from(paciente).where(eq(paciente.cpf, cpf));
  return linha ?? null;
}

async function exists(idPaciente) {
  const [linha] = await db.select({ id: paciente.id_paciente }).from(paciente)
    .where(eq(paciente.id_paciente, idPaciente));
  return Boolean(linha);
}

async function countAll() {
  const [{ total }] = await db.select({ total: count() }).from(paciente);
  return total;
}

async function create(dados) {
  const [linha] = await db.insert(paciente).values(dados).returning();
  return linha;
}

module.exports = { findAll, findByCpf, exists, count: countAll, create };
