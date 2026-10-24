-- Versão PostgreSQL de docs/criar-tabelas-atendimento-paciente.sql
CREATE TABLE IF NOT EXISTS paciente (
    id_paciente     INTEGER GENERATED ALWAYS AS IDENTITY,
    nome            VARCHAR(100) NOT NULL,
    cpf             VARCHAR(11) NOT NULL,
    data_nascimento DATE NOT NULL,
    genero          VARCHAR(20),
    telefone        VARCHAR(15),

    CONSTRAINT pk_paciente PRIMARY KEY (id_paciente),
    CONSTRAINT uk_paciente_cpf UNIQUE (cpf)
);

CREATE TABLE IF NOT EXISTS atendimento (
    id_atendimento    INTEGER GENERATED ALWAYS AS IDENTITY,
    id_paciente       INTEGER NOT NULL,
    data_hora_chegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status            VARCHAR(30) NOT NULL,

    CONSTRAINT pk_atendimento PRIMARY KEY (id_atendimento),
    CONSTRAINT fk_atendimento_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente (id_paciente)
        ON DELETE CASCADE
);

-- Dados de teste
INSERT INTO paciente (nome, cpf, data_nascimento, genero, telefone) VALUES
    ('Maria da Silva', '12345678900', '1990-03-14', 'Feminino', '(11) 98765-4321'),
    ('João Pereira',   '98765432100', '1987-09-02', 'Masculino', '(19) 99123-4567'),
    ('Ana Souza',      '45678912300', '2002-11-30', NULL, NULL)
ON CONFLICT (cpf) DO NOTHING;
