const { eq, desc, asc, and, notInArray } = require('drizzle-orm');
const { getConnection } = require('../db');
const { atendimento, paciente } = require('../db/schema');

const STATUS_FINAIS = ['Encerrado', 'Cancelado'];

async function findStatusAtual(idPaciente) {
  const [ultimo] = await getConnection()
    .select({ status_atendimento: atendimento.status_atendimento })
    .from(atendimento)
    .where(eq(atendimento.id_paciente, idPaciente))
    .orderBy(desc(atendimento.data_hora_chegada))
    .limit(1);
  return ultimo ? ultimo.status_atendimento : null;
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
      notInArray(atendimento.status_atendimento, STATUS_FINAIS),
    ))
    .limit(1);
  return linha ?? null;
}

async function findByNumero(numero) {
  const [linha] = await getConnection()
    .select()
    .from(atendimento)
    .where(eq(atendimento.numero_atendimento, numero));
  return linha ?? null;
}

async function findByCpf(cpf) {
  return getConnection()
    .select({
      id_atendimento: atendimento.id_atendimento,
      numero_atendimento: atendimento.numero_atendimento,
      id_paciente: atendimento.id_paciente,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(paciente.cpf, cpf))
    .orderBy(desc(atendimento.data_hora_chegada));
}

async function findAbertos() {
  return getConnection()
    .select({
      id_atendimento: atendimento.id_atendimento,
      numero_atendimento: atendimento.numero_atendimento,
      id_paciente: atendimento.id_paciente,
      nome: paciente.nome,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.status_atendimento, 'Aberto'))
    .orderBy(asc(atendimento.data_hora_chegada));
}

module.exports = { findStatusAtual, findEmAndamento, findByNumero, findByCpf, create, findAbertos };
