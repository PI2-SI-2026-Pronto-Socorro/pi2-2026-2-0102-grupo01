const { sql } = require('drizzle-orm');
const { getConnection } = require('./index');

async function bootstrap() {
  const db = getConnection();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS paciente (
      id_paciente     INTEGER GENERATED ALWAYS AS IDENTITY,
      nome            VARCHAR(100) NOT NULL,
      cpf             VARCHAR(11) NOT NULL,
      data_nascimento DATE NOT NULL,
      genero          VARCHAR(20),
      telefone        VARCHAR(15),
      CONSTRAINT pk_paciente PRIMARY KEY (id_paciente),
      CONSTRAINT uk_paciente_cpf UNIQUE (cpf)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS atendimento (
      id_atendimento    INTEGER GENERATED ALWAYS AS IDENTITY,
      id_paciente       INTEGER NOT NULL,
      data_hora_chegada TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      status            VARCHAR(30) NOT NULL,
      CONSTRAINT pk_atendimento PRIMARY KEY (id_atendimento),
      CONSTRAINT fk_atendimento_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente (id_paciente) ON DELETE CASCADE
    )
  `);
}

module.exports = { bootstrap };
