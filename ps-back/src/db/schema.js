const { sql } = require('drizzle-orm');
const {
  pgTable, integer, varchar, date, timestamp, primaryKey, foreignKey, unique, uniqueIndex,
} = require('drizzle-orm/pg-core');

const paciente = pgTable('paciente', {
  id_paciente: integer('id_paciente').generatedAlwaysAsIdentity(),
  nome: varchar('nome', { length: 100 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull(),
  data_nascimento: date('data_nascimento', { mode: 'string' }).notNull(),
  genero: varchar('genero', { length: 20 }),
  telefone: varchar('telefone', { length: 15 }),
}, (t) => [
  primaryKey({ name: 'pk_paciente', columns: [t.id_paciente] }),
  unique('uk_paciente_cpf').on(t.cpf),
]);

const atendimento = pgTable('atendimento', {
  id_atendimento: integer('id_atendimento').generatedAlwaysAsIdentity(),
  id_paciente: integer('id_paciente').notNull(),
  data_hora_chegada: timestamp('data_hora_chegada', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 30 }).notNull(),
}, (t) => [
  primaryKey({ name: 'pk_atendimento', columns: [t.id_atendimento] }),
  foreignKey({ name: 'fk_atendimento_paciente', columns: [t.id_paciente], foreignColumns: [paciente.id_paciente] })
    .onDelete('cascade'),
  uniqueIndex('uk_atendimento_em_andamento').on(t.id_paciente).where(sql`${t.status} <> 'Finalizado'`),
]);

module.exports = { paciente, atendimento };
