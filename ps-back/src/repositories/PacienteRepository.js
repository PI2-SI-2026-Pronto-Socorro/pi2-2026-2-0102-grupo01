const { eq, count } = require('drizzle-orm');
const { getConnection } = require('../db');
const { paciente } = require('../db/schema');
const Paciente = require('../models/Paciente');

async function findAll() {
  const linhas = await getConnection().select().from(paciente);
  return linhas.map((linha) => new Paciente(linha));
}

async function findByCpf(cpf) {
  const [linha] = await getConnection().select().from(paciente).where(eq(paciente.cpf, cpf));
  return linha ? new Paciente(linha) : null;
}

async function exists(idPaciente) {
  const [linha] = await getConnection().select({ id: paciente.id_paciente }).from(paciente)
    .where(eq(paciente.id_paciente, idPaciente));
  return Boolean(linha);
}

async function count_() {
  const [{ total }] = await getConnection().select({ total: count() }).from(paciente);
  return total;
}

async function create(novoPaciente) {
  const [linha] = await getConnection().insert(paciente).values(novoPaciente.paraInsercao()).returning();
  return new Paciente(linha);
}

module.exports = { findAll, findByCpf, exists, count: count_, create };
