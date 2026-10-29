const { eq, desc, asc, and, ne } = require('drizzle-orm');
const { getConnection } = require('../db');
const { atendimento, paciente } = require('../db/schema');

const comPaciente = {
  id_atendimento: atendimento.id_atendimento,
  id_paciente: atendimento.id_paciente,
  status: atendimento.status,
  data_hora_chegada: atendimento.data_hora_chegada,
  nome: paciente.nome,
  cpf: paciente.cpf,
};

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

async function findById(idAtendimento) {
  const [linha] = await getConnection()
    .select(comPaciente)
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.id_atendimento, idAtendimento));
  return linha ?? null;
}

async function findByCpf(cpf) {
  return getConnection()
    .select(comPaciente)
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(paciente.cpf, cpf))
    .orderBy(desc(atendimento.data_hora_chegada));
}

async function findAbertos() {
  return getConnection()
    .select(comPaciente)
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.status, 'Aberto'))
    .orderBy(asc(atendimento.data_hora_chegada));
}

module.exports = { findStatusAtual, findEmAndamento, findById, findByCpf, create, findAbertos };
