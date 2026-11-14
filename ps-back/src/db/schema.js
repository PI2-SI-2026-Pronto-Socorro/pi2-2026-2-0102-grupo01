const { sql } = require('drizzle-orm');
const {
  pgTable, pgEnum, pgSequence, uuid, varchar, char, date, timestamp, numeric, smallint, text,
  primaryKey, foreignKey, unique, uniqueIndex, index, check,
} = require('drizzle-orm/pg-core');

const statusAtendimentoEnum = pgEnum('status_atendimento_enum', ['Aberto', 'Triado', 'Confirmado', 'Encerrado', 'Cancelado']);
const classificacaoRiscoEnum = pgEnum('classificacao_risco_enum', ['Não Urgente', 'Pouco Urgente', 'Urgente', 'Muito Urgente', 'Emergência']);
const cargoProfissionalEnum = pgEnum('cargo_profissional_enum', ['Médico', 'Enfermeiro', 'Técnico de Enfermagem', 'Recepcionista', 'Outro']);
const perfilAcessoEnum = pgEnum('perfil_acesso_enum', ['Recepção', 'Enfermagem', 'Médico']);
const statusExameEnum = pgEnum('status_exame_enum', ['Solicitado', 'Em andamento', 'Concluído', 'Cancelado']);

const seqNumeroAtendimento = pgSequence('seq_numero_atendimento');

const paciente = pgTable('paciente', {
  id_paciente: uuid('id_paciente').defaultRandom().notNull(),
  nome: varchar('nome', { length: 100 }).notNull(),
  cpf: char('cpf', { length: 11 }),
  rg: varchar('rg', { length: 15 }),
  data_nascimento: date('data_nascimento', { mode: 'string' }),
  genero: varchar('genero', { length: 20 }),
  telefone: varchar('telefone', { length: 15 }),
  endereco: varchar('endereco', { length: 255 }),
  nome_pai: varchar('nome_pai', { length: 100 }),
  nome_mae: varchar('nome_mae', { length: 100 }),
}, (t) => [
  primaryKey({ name: 'pk_paciente', columns: [t.id_paciente] }),
  unique('uk_paciente_cpf').on(t.cpf),
]);

const prontuario = pgTable('prontuario', {
  id_prontuario: uuid('id_prontuario').defaultRandom().notNull(),
  id_paciente: uuid('id_paciente').notNull(),
  data_abertura: timestamp('data_abertura', { withTimezone: true }).notNull().defaultNow(),
  obs: text('obs'),
}, (t) => [
  primaryKey({ name: 'pk_prontuario', columns: [t.id_prontuario] }),
  unique('uk_prontuario_paciente').on(t.id_paciente),
  foreignKey({ name: 'fk_prontuario_paciente', columns: [t.id_paciente], foreignColumns: [paciente.id_paciente] })
    .onDelete('restrict'),
]);

const profissional = pgTable('profissional', {
  id_profissional: uuid('id_profissional').defaultRandom().notNull(),
  nome: varchar('nome', { length: 100 }).notNull(),
  cpf: char('cpf', { length: 11 }).notNull(),
  telefone: varchar('telefone', { length: 15 }),
  cargo: cargoProfissionalEnum('cargo').notNull(),
  registro_profissional: varchar('registro_profissional', { length: 25 }),
  plantao: varchar('plantao', { length: 50 }),
  especialidade: varchar('especialidade', { length: 80 }),
  perfil: perfilAcessoEnum('perfil').notNull(),
  usuario: varchar('usuario', { length: 50 }).notNull(),
  senha_hash: varchar('senha_hash', { length: 255 }).notNull(),
}, (t) => [
  primaryKey({ name: 'pk_profissional', columns: [t.id_profissional] }),
  unique('uk_profissional_cpf').on(t.cpf),
  unique('uk_profissional_registro').on(t.registro_profissional),
  unique('uk_profissional_usuario').on(t.usuario),
]);

const atendimento = pgTable('atendimento', {
  id_atendimento: uuid('id_atendimento').defaultRandom().notNull(),
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
  index('idx_atendimento_paciente').on(t.id_paciente),
  index('idx_atendimento_profissional').on(t.id_profissional),
]);

const triagem = pgTable('triagem', {
  id_triagem: uuid('id_triagem').defaultRandom().notNull(),
  id_atendimento: uuid('id_atendimento').notNull(),
  id_profissional: uuid('id_profissional').notNull(),
  peso: numeric('peso', { precision: 5, scale: 2 }),
  altura: numeric('altura', { precision: 3, scale: 2 }),
  pressao_sistolica: smallint('pressao_sistolica'),
  pressao_diastolica: smallint('pressao_diastolica'),
  temperatura: numeric('temperatura', { precision: 4, scale: 1 }),
  frequencia_cardiaca: smallint('frequencia_cardiaca'),
  classificacao_risco: classificacaoRiscoEnum('classificacao_risco').notNull(),
  data_hora_triagem: timestamp('data_hora_triagem', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ name: 'pk_triagem', columns: [t.id_triagem] }),
  unique('uk_triagem_atendimento').on(t.id_atendimento),
  foreignKey({ name: 'fk_triagem_atendimento', columns: [t.id_atendimento], foreignColumns: [atendimento.id_atendimento] })
    .onDelete('restrict'),
  foreignKey({ name: 'fk_triagem_profissional', columns: [t.id_profissional], foreignColumns: [profissional.id_profissional] })
    .onDelete('restrict'),
  index('idx_triagem_profissional').on(t.id_profissional),
  check('ck_triagem_peso', sql`${t.peso} > 0 AND ${t.peso} < 500`),
  check('ck_triagem_altura', sql`${t.altura} > 0 AND ${t.altura} < 3`),
  check('ck_triagem_temperatura', sql`${t.temperatura} BETWEEN 25 AND 45`),
  check('ck_triagem_freq', sql`${t.frequencia_cardiaca} BETWEEN 0 AND 300`),
  check('ck_triagem_pressao', sql`${t.pressao_sistolica} >= ${t.pressao_diastolica}`),
]);

const queixa = pgTable('queixa', {
  id_queixa: uuid('id_queixa').defaultRandom().notNull(),
  id_triagem: uuid('id_triagem').notNull(),
  sintomas: text('sintomas').notNull(),
  duracao_sintoma: varchar('duracao_sintoma', { length: 50 }),
}, (t) => [
  primaryKey({ name: 'pk_queixa', columns: [t.id_queixa] }),
  foreignKey({ name: 'fk_queixa_triagem', columns: [t.id_triagem], foreignColumns: [triagem.id_triagem] })
    .onDelete('restrict'),
  index('idx_queixa_triagem').on(t.id_triagem),
]);

const consultaMedica = pgTable('consulta_medica', {
  id_consulta: uuid('id_consulta').defaultRandom().notNull(),
  id_atendimento: uuid('id_atendimento').notNull(),
  id_profissional: uuid('id_profissional').notNull(),
  data_hora_inicio: timestamp('data_hora_inicio', { withTimezone: true }).notNull().defaultNow(),
  data_hora_fim: timestamp('data_hora_fim', { withTimezone: true }),
  diagnostico: text('diagnostico'),
}, (t) => [
  primaryKey({ name: 'pk_consulta_medica', columns: [t.id_consulta] }),
  foreignKey({ name: 'fk_consulta_atendimento', columns: [t.id_atendimento], foreignColumns: [atendimento.id_atendimento] })
    .onDelete('restrict'),
  foreignKey({ name: 'fk_consulta_profissional', columns: [t.id_profissional], foreignColumns: [profissional.id_profissional] })
    .onDelete('restrict'),
  index('idx_consulta_atendimento').on(t.id_atendimento),
  index('idx_consulta_profissional').on(t.id_profissional),
  check('ck_consulta_periodo', sql`${t.data_hora_fim} IS NULL OR ${t.data_hora_fim} >= ${t.data_hora_inicio}`),
]);

const internacao = pgTable('internacao', {
  id_internacao: uuid('id_internacao').defaultRandom().notNull(),
  id_consulta: uuid('id_consulta').notNull(),
  data_hora_indicacao: timestamp('data_hora_indicacao', { withTimezone: true }).notNull().defaultNow(),
  motivo: varchar('motivo', { length: 255 }).notNull(),
  leito: varchar('leito', { length: 20 }),
}, (t) => [
  primaryKey({ name: 'pk_internacao', columns: [t.id_internacao] }),
  unique('uk_internacao_consulta').on(t.id_consulta),
  foreignKey({ name: 'fk_internacao_consulta', columns: [t.id_consulta], foreignColumns: [consultaMedica.id_consulta] })
    .onDelete('restrict'),
]);

const exame = pgTable('exame', {
  id_exame: uuid('id_exame').defaultRandom().notNull(),
  id_consulta: uuid('id_consulta').notNull(),
  tipo: varchar('tipo', { length: 80 }).notNull(),
  data_solicitacao: timestamp('data_solicitacao', { withTimezone: true }).notNull().defaultNow(),
  data_realizacao: timestamp('data_realizacao', { withTimezone: true }),
  resultado: text('resultado'),
  status_exame: statusExameEnum('status_exame').notNull().default('Solicitado'),
}, (t) => [
  primaryKey({ name: 'pk_exame', columns: [t.id_exame] }),
  foreignKey({ name: 'fk_exame_consulta', columns: [t.id_consulta], foreignColumns: [consultaMedica.id_consulta] })
    .onDelete('restrict'),
  index('idx_exame_consulta').on(t.id_consulta),
  check('ck_exame_periodo', sql`${t.data_realizacao} IS NULL OR ${t.data_realizacao} >= ${t.data_solicitacao}`),
]);

const prescricao = pgTable('prescricao', {
  id_prescricao: uuid('id_prescricao').defaultRandom().notNull(),
  id_consulta: uuid('id_consulta').notNull(),
  data_hora: timestamp('data_hora', { withTimezone: true }).notNull().defaultNow(),
  orientacoes: text('orientacoes'),
}, (t) => [
  primaryKey({ name: 'pk_prescricao', columns: [t.id_prescricao] }),
  foreignKey({ name: 'fk_prescricao_consulta', columns: [t.id_consulta], foreignColumns: [consultaMedica.id_consulta] })
    .onDelete('restrict'),
  index('idx_prescricao_consulta').on(t.id_consulta),
]);

const medicacao = pgTable('medicacao', {
  id_medicacao: uuid('id_medicacao').defaultRandom().notNull(),
  medicamento: varchar('medicamento', { length: 100 }).notNull(),
  principio_ativo: varchar('principio_ativo', { length: 100 }),
  apresentacao: varchar('apresentacao', { length: 50 }),
  concentracao: varchar('concentracao', { length: 50 }),
}, (t) => [
  primaryKey({ name: 'pk_medicacao', columns: [t.id_medicacao] }),
  unique('uk_medicacao_remedio').on(t.medicamento, t.apresentacao, t.concentracao).nullsNotDistinct(),
]);

const prescricaoMedicacao = pgTable('prescricao_medicacao', {
  id_prescricao: uuid('id_prescricao').notNull(),
  id_medicacao: uuid('id_medicacao').notNull(),
  dose: varchar('dose', { length: 50 }).notNull(),
  intervalo_horas: smallint('intervalo_horas').notNull(),
  duracao_dias: smallint('duracao_dias'),
  via: varchar('via', { length: 30 }),
  observacao: varchar('observacao', { length: 255 }),
}, (t) => [
  primaryKey({ name: 'pk_prescricao_medicacao', columns: [t.id_prescricao, t.id_medicacao] }),
  foreignKey({ name: 'fk_presmed_prescricao', columns: [t.id_prescricao], foreignColumns: [prescricao.id_prescricao] })
    .onDelete('restrict'),
  foreignKey({ name: 'fk_presmed_medicacao', columns: [t.id_medicacao], foreignColumns: [medicacao.id_medicacao] })
    .onDelete('restrict'),
  index('idx_presmed_medicacao').on(t.id_medicacao),
  check('ck_presmed_intervalo', sql`${t.intervalo_horas} > 0 AND ${t.intervalo_horas} <= 168`),
  check('ck_presmed_duracao', sql`${t.duracao_dias} IS NULL OR ${t.duracao_dias} > 0`),
]);

module.exports = {
  statusAtendimentoEnum, classificacaoRiscoEnum, cargoProfissionalEnum, perfilAcessoEnum, statusExameEnum,
  seqNumeroAtendimento,
  paciente, prontuario, profissional, atendimento, triagem, queixa,
  consultaMedica, internacao, exame, prescricao, medicacao, prescricaoMedicacao,
};