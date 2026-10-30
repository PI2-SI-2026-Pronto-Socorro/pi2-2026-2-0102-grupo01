const { sql } = require('drizzle-orm');
const {
  pgTable, pgEnum, pgSequence, uuid, varchar, char, date, timestamp, numeric, smallint, text,
  primaryKey, foreignKey, unique, uniqueIndex, check,
} = require('drizzle-orm/pg-core');

const statusAtendimentoEnum = pgEnum('status_atendimento_enum', ['Aberto', 'Triado', 'Confirmado', 'Encerrado', 'Cancelado']);
const classificacaoRiscoEnum = pgEnum('classificacao_risco_enum', ['Não Urgente', 'Pouco Urgente', 'Urgente', 'Muito Urgente', 'Emergência']);
const cargoProfissionalEnum = pgEnum('cargo_profissional_enum', ['Médico', 'Enfermeiro', 'Técnico de Enfermagem', 'Recepcionista', 'Outro']);
const perfilAcessoEnum = pgEnum('perfil_acesso_enum', ['Recepção', 'Enfermagem', 'Médico']);

const seqNumeroAtendimento = pgSequence('seq_numero_atendimento');

const paciente = pgTable('paciente', {
  id_paciente: uuid('id_paciente').defaultRandom(),
  nome: varchar('nome', { length: 100 }).notNull(),
  cpf: char('cpf', { length: 11 }),
  rg: varchar('rg', { length: 15 }),
  data_nascimento: date('data_nascimento', { mode: 'string' }),
  genero: varchar('genero', { length: 20 }),
  telefone: varchar('telefone', { length: 15 }),
}, (t) => [
  primaryKey({ name: 'pk_paciente', columns: [t.id_paciente] }),
  unique('uk_paciente_cpf').on(t.cpf),
]);

const profissional = pgTable('profissional', {
  id_profissional: uuid('id_profissional').defaultRandom(),
  nome: varchar('nome', { length: 100 }).notNull(),
  cpf: char('cpf', { length: 11 }).notNull(),
  cargo: cargoProfissionalEnum('cargo').notNull(),
  registro_profissional: varchar('registro_profissional', { length: 25 }),
  perfil: perfilAcessoEnum('perfil').notNull(),
  usuario: varchar('usuario', { length: 50 }).notNull(),
  senha_hash: varchar('senha_hash', { length: 255 }).notNull(),
}, (t) => [
  primaryKey({ name: 'pk_profissional', columns: [t.id_profissional] }),
  unique('uk_profissional_cpf').on(t.cpf),
  unique('uk_profissional_usuario').on(t.usuario),
]);

const atendimento = pgTable('atendimento', {
  id_atendimento: uuid('id_atendimento').defaultRandom(),
  id_paciente: uuid('id_paciente').notNull(),
  id_profissional: uuid('id_profissional'),
  data_hora_chegada: timestamp('data_hora_chegada', { withTimezone: true }).notNull().defaultNow(),
  data_hora_saida: timestamp('data_hora_saida', { withTimezone: true }),
  numero_atendimento: varchar('numero_atendimento', { length: 11 }).notNull()
    .default(sql`'AT' || LPAD(nextval('seq_numero_atendimento')::text, 4, '0')`),
  status_atendimento: statusAtendimentoEnum('status_atendimento').notNull().default('Aberto'),
  motivo_atendimento: varchar('motivo_atendimento', { length: 255 }),
}, (t) => [
  primaryKey({ name: 'pk_atendimento', columns: [t.id_atendimento] }),
  unique('uk_atendimento_numero').on(t.numero_atendimento),
  foreignKey({ name: 'fk_atendimento_paciente', columns: [t.id_paciente], foreignColumns: [paciente.id_paciente] })
    .onDelete('restrict'),
  foreignKey({ name: 'fk_atendimento_profissional', columns: [t.id_profissional], foreignColumns: [profissional.id_profissional] })
    .onDelete('restrict'),
  uniqueIndex('uk_atendimento_em_andamento').on(t.id_paciente)
    .where(sql`${t.status_atendimento} NOT IN ('Encerrado', 'Cancelado')`),
]);

const triagem = pgTable('triagem', {
  id_triagem: uuid('id_triagem').defaultRandom(),
  id_atendimento: uuid('id_atendimento').notNull(),
  id_profissional: uuid('id_profissional').notNull(),
  peso: numeric('peso', { precision: 5, scale: 2 }),
  altura: numeric('altura', { precision: 3, scale: 2 }),
  pressao_sistolica: smallint('pressao_sistolica'),
  pressao_diastolica: smallint('pressao_diastolica'),
  temperatura: numeric('temperatura', { precision: 4, scale: 1 }),
  frequencia_cardiaca: smallint('frequencia_cardiaca'),
  sintomas_relatados: text('sintomas_relatados'),
  classificacao_risco: classificacaoRiscoEnum('classificacao_risco').notNull(),
  data_hora_triagem: timestamp('data_hora_triagem', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ name: 'pk_triagem', columns: [t.id_triagem] }),
  unique('uk_triagem_atendimento').on(t.id_atendimento),
  foreignKey({ name: 'fk_triagem_atendimento', columns: [t.id_atendimento], foreignColumns: [atendimento.id_atendimento] })
    .onDelete('restrict'),
  foreignKey({ name: 'fk_triagem_profissional', columns: [t.id_profissional], foreignColumns: [profissional.id_profissional] })
    .onDelete('restrict'),
  check('ck_triagem_peso', sql`${t.peso} > 0 AND ${t.peso} < 500`),
  check('ck_triagem_altura', sql`${t.altura} > 0 AND ${t.altura} < 3`),
  check('ck_triagem_temperatura', sql`${t.temperatura} BETWEEN 25 AND 45`),
  check('ck_triagem_freq', sql`${t.frequencia_cardiaca} BETWEEN 0 AND 300`),
  check('ck_triagem_pressao', sql`${t.pressao_sistolica} >= ${t.pressao_diastolica}`),
]);

const medicacao = pgTable('medicacao', {
  id_medicacao: uuid('id_medicacao').defaultRandom(),
  id_atendimento: uuid('id_atendimento').notNull(),
  id_profissional: uuid('id_profissional').notNull(),
  medicamento: varchar('medicamento', { length: 100 }).notNull(),
  dose: varchar('dose', { length: 50 }).notNull(),
  via: varchar('via', { length: 30 }),
  observacao: varchar('observacao', { length: 255 }),
  data_hora: timestamp('data_hora', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ name: 'pk_medicacao', columns: [t.id_medicacao] }),
  foreignKey({ name: 'fk_medicacao_atendimento', columns: [t.id_atendimento], foreignColumns: [atendimento.id_atendimento] })
    .onDelete('restrict'),
  foreignKey({ name: 'fk_medicacao_profissional', columns: [t.id_profissional], foreignColumns: [profissional.id_profissional] })
    .onDelete('restrict'),
]);

module.exports = {
  statusAtendimentoEnum, classificacaoRiscoEnum, cargoProfissionalEnum, perfilAcessoEnum, seqNumeroAtendimento,
  paciente, profissional, atendimento, triagem, medicacao,
};
