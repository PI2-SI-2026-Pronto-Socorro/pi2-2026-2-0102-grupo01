const { eq, desc, asc, and, or, gte, notInArray, sql } = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, paciente } = require('../db/schema');

const STATUS_FINAIS = ['Encerrado', 'Cancelado'];

async function findStatusAtual(idPaciente) {
  const [ultimo] = await db
    .select({ status_atendimento: atendimento.status_atendimento })
    .from(atendimento)
    .where(eq(atendimento.id_paciente, idPaciente))
    .orderBy(desc(atendimento.data_hora_chegada))
    .limit(1);
  return ultimo ? ultimo.status_atendimento : null;
}

async function create(dados) {
  const [linha] = await db.insert(atendimento).values(dados).returning();
  return linha;
}

async function findEmAndamento(idPaciente) {
  const [linha] = await db
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
  const [linha] = await db
    .select({
      id_atendimento: atendimento.id_atendimento,
      numero_atendimento: atendimento.numero_atendimento,
      id_paciente: atendimento.id_paciente,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
      motivo_atendimento: atendimento.motivo_atendimento,
      nome: paciente.nome,
      cpf: paciente.cpf,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.numero_atendimento, numero));
  return linha ?? null;
}

// Altera, numa transação, o atendimento e os dados cadastrais do paciente.
// A linha do atendimento fica travada (FOR UPDATE) enquanto a situação é conferida,
// para ninguém confirmar ou cancelar o atendimento no meio da alteração.
async function alterarDados(numero, dadosAtendimento, dadosPaciente, statusBloqueados) {
  return db.transaction(async (tx) => {
    const [atual] = await tx
      .select({
        id_atendimento: atendimento.id_atendimento,
        id_paciente: atendimento.id_paciente,
        status_atendimento: atendimento.status_atendimento,
      })
      .from(atendimento)
      .where(eq(atendimento.numero_atendimento, numero))
      .for('update');

    if (!atual) return { encontrado: false };
    if (statusBloqueados.includes(atual.status_atendimento)) {
      return { encontrado: true, bloqueado: true, status_atendimento: atual.status_atendimento };
    }

    if (Object.keys(dadosAtendimento).length > 0) {
      await tx.update(atendimento).set(dadosAtendimento)
        .where(eq(atendimento.id_atendimento, atual.id_atendimento));
    }
    let pacienteAtualizado;
    if (Object.keys(dadosPaciente).length > 0) {
      [pacienteAtualizado] = await tx.update(paciente).set(dadosPaciente)
        .where(eq(paciente.id_paciente, atual.id_paciente)).returning();
    } else {
      [pacienteAtualizado] = await tx.select().from(paciente)
        .where(eq(paciente.id_paciente, atual.id_paciente));
    }
    return { encontrado: true, bloqueado: false, paciente: pacienteAtualizado };
  });
}

async function findByCpf(cpf) {
  return db
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
  return db
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

async function findPainel() {
  const inicioDoDia = sql`(date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')`;
  return db
    .select({
      id_atendimento: atendimento.id_atendimento,
      numero_atendimento: atendimento.numero_atendimento,
      id_paciente: atendimento.id_paciente,
      nome: paciente.nome,
      cpf: paciente.cpf,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(or(
      gte(atendimento.data_hora_chegada, inicioDoDia),
      notInArray(atendimento.status_atendimento, STATUS_FINAIS),
    ))
    .orderBy(desc(atendimento.data_hora_chegada));
}

async function cancelarSeAberto(numero) {
  const [linha] = await db
    .update(atendimento)
    .set({ status_atendimento: 'Cancelado', data_hora_saida: sql`now()` })
    .where(and(
      eq(atendimento.numero_atendimento, numero),
      eq(atendimento.status_atendimento, 'Aberto'),
    ))
    .returning();
  return linha ?? null;
}

module.exports = {
  findStatusAtual, findEmAndamento, findByNumero, findByCpf, create, findAbertos, findPainel, cancelarSeAberto, alterarDados,
};
