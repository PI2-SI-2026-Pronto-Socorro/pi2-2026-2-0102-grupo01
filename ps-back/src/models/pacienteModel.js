const { eq, count } = require('drizzle-orm');
const db = require('../config/db');
const { paciente } = require('./schema');

async function listar() {
  return db.select().from(paciente);
}

async function buscarPorCpf(cpf) {
  const [encontrado] = await db.select().from(paciente).where(eq(paciente.cpf, cpf));
  return encontrado ?? null;
}

async function existe(idPaciente) {
  const [encontrado] = await db.select({ id: paciente.id_paciente }).from(paciente)
    .where(eq(paciente.id_paciente, idPaciente));
  return Boolean(encontrado);
}

async function contar() {
  const [{ total }] = await db.select({ total: count() }).from(paciente);
  return total;
}

async function criar(dados) {
  const [novo] = await db.insert(paciente).values(dados).returning();
  return novo;
}

module.exports = { listar, buscarPorCpf, existe, contar, criar };
