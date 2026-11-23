const { eq, asc, inArray, count, sql } = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, paciente, triagem } = require('../db/schema');

const STATUS_VISIVEIS_NO_PAINEL = ['Aberto', 'Triado'];

async function listarAtendimentosDoPainel() {
  return db
    .select({
      numero_atendimento: atendimento.numero_atendimento,
      nome: paciente.nome,
      cpf: paciente.cpf,
      data_nascimento: paciente.data_nascimento,
      classificacao_risco: triagem.classificacao_risco,
      status_atendimento: atendimento.status_atendimento,
      data_hora_chegada: atendimento.data_hora_chegada,
    })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .leftJoin(triagem, eq(triagem.id_atendimento, atendimento.id_atendimento))
    .where(inArray(atendimento.status_atendimento, STATUS_VISIVEIS_NO_PAINEL))
    .orderBy(asc(atendimento.data_hora_chegada));
}

async function contarAtendimentosDoDiaPorStatus() {
  return db
    .select({ status_atendimento: atendimento.status_atendimento, quantidade: count() })
    .from(atendimento)
    .where(sql`${atendimento.data_hora_chegada} >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'`)
    .groupBy(atendimento.status_atendimento);
}

module.exports = { listarAtendimentosDoPainel, contarAtendimentosDoDiaPorStatus };
