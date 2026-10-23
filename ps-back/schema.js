const { pgTable, integer, varchar, date, timestamp } = require('drizzle-orm/pg-core');

const paciente = pgTable('paciente', {
  id_paciente: integer('id_paciente').primaryKey().generatedAlwaysAsIdentity(),
  nome: varchar('nome', { length: 100 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).notNull().unique('uk_paciente_cpf'),
  data_nascimento: date('data_nascimento', { mode: 'string' }).notNull(),
  genero: varchar('genero', { length: 20 }),
  telefone: varchar('telefone', { length: 15 }),
});

const atendimento = pgTable('atendimento', {
  id_atendimento: integer('id_atendimento').primaryKey().generatedAlwaysAsIdentity(),
  id_paciente: integer('id_paciente').notNull()
    .references(() => paciente.id_paciente, { onDelete: 'cascade' }),
  data_hora_chegada: timestamp('data_hora_chegada').notNull().defaultNow(),
  status: varchar('status', { length: 30 }).notNull(),
});

module.exports = { paciente, atendimento };
