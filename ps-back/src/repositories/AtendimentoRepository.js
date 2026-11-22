const {
  eq, desc, asc, and, or, isNull, notInArray, sql,
} = require('drizzle-orm');
const { db } = require('../db');
const {
  atendimento, paciente, triagem, profissional,
} = require('../db/schema');
const { CLASSIFICACOES_MANCHESTER } = require('../utils/classificacaoManchester');
const { STATUS_FINAIS, statusDeOrigem } = require('../utils/transicoesAtendimento');

const PRIORIDADE_MANCHESTER = sql`CASE ${triagem.classificacao_risco} ${sql.join(
  CLASSIFICACOES_MANCHESTER.map(({ classificacao, prioridade }) => sql`WHEN ${classificacao} THEN ${sql.raw(String(prioridade))}`),
  sql` `,
)} END`;

async function findTriados() {
  return db
    .select({
      id_atendimento: atendimento.id_atendimento,
      numero_atendimento: atendimento.numero_atendimento,
      id_paciente: atendimento.id_paciente,
      nome: paciente.nome,
      data_nascimento: paciente.data_nascimento,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
      classificacao_risco: triagem.classificacao_risco,
      data_hora_triagem: triagem.data_hora_triagem,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .leftJoin(triagem, eq(triagem.id_atendimento, atendimento.id_atendimento))
    .where(eq(atendimento.status_atendimento, 'Triado'))
    .orderBy(asc(PRIORIDADE_MANCHESTER), asc(atendimento.data_hora_chegada));
}

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
      id_profissional: atendimento.id_profissional,
      nome: paciente.nome,
      cpf: paciente.cpf,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.numero_atendimento, numero));
  return linha ?? null;
}

async function abrirParaPacienteNaoIdentificado(dadosPaciente, dadosAtendimento) {
  return db.transaction(async (tx) => {
    const [pacienteCriado] = await tx.insert(paciente).values(dadosPaciente).returning();
    const [atendimentoCriado] = await tx.insert(atendimento)
      .values({ ...dadosAtendimento, id_paciente: pacienteCriado.id_paciente })
      .returning();
    return { paciente: pacienteCriado, atendimento: atendimentoCriado };
  });
}

async function reservarParaMedico(numero, idMedico) {
  const [linha] = await db
    .update(atendimento)
    .set({ id_profissional: idMedico })
    .where(and(
      eq(atendimento.numero_atendimento, numero),
      eq(atendimento.status_atendimento, statusDeOrigem('Confirmado')),
      or(isNull(atendimento.id_profissional), eq(atendimento.id_profissional, idMedico)),
    ))
    .returning();
  return linha ?? null;
}

async function findReserva(numero) {
  const [linha] = await db
    .select({
      numero_atendimento: atendimento.numero_atendimento,
      status_atendimento: atendimento.status_atendimento,
      id_profissional: atendimento.id_profissional,
      nome_profissional: profissional.nome,
    })
    .from(atendimento)
    .leftJoin(profissional, eq(profissional.id_profissional, atendimento.id_profissional))
    .where(eq(atendimento.numero_atendimento, numero));
  return linha ?? null;
}

async function atualizarOuBuscar(tx, tabela, colunaId, id, dados) {
  const filtro = eq(colunaId, id);
  const [linha] = Object.keys(dados).length > 0
    ? await tx.update(tabela).set(dados).where(filtro).returning()
    : await tx.select().from(tabela).where(filtro);
  return linha;
}

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

    const atendimentoAtualizado = await atualizarOuBuscar(
      tx, atendimento, atendimento.id_atendimento, atual.id_atendimento, dadosAtendimento,
    );
    const pacienteAtualizado = await atualizarOuBuscar(
      tx, paciente, paciente.id_paciente, atual.id_paciente, dadosPaciente,
    );
    return {
      encontrado: true, bloqueado: false, atendimento: atendimentoAtualizado, paciente: pacienteAtualizado,
    };
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
      nome: paciente.nome,
      cpf: paciente.cpf,
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
    .where(eq(atendimento.status_atendimento, statusDeOrigem('Triado')))
    .orderBy(asc(atendimento.data_hora_chegada));
}

async function cancelarSeAberto(numero) {
  const [linha] = await db
    .update(atendimento)
    .set({ status_atendimento: 'Cancelado', data_hora_saida: sql`now()` })
    .where(and(
      eq(atendimento.numero_atendimento, numero),
      eq(atendimento.status_atendimento, statusDeOrigem('Cancelado')),
    ))
    .returning();
  return linha ?? null;
}

async function travarAtendimentoEBuscarStatus(transacao, idAtendimento) {
  const [atendimentoTravado] = await transacao
    .select({ status_atendimento: atendimento.status_atendimento })
    .from(atendimento)
    .where(eq(atendimento.id_atendimento, idAtendimento))
    .for('update');
  return atendimentoTravado ? atendimentoTravado.status_atendimento : null;
}

module.exports = {
  findStatusAtual, findEmAndamento, findByNumero, findByCpf, create, findAbertos, findTriados, cancelarSeAberto,
  alterarDados, travarAtendimentoEBuscarStatus, abrirParaPacienteNaoIdentificado, reservarParaMedico, findReserva,
};
