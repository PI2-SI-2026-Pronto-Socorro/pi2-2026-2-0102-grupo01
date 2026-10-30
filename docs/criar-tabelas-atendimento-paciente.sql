CREATE TYPE status_atendimento_enum AS ENUM ('Aberto', 'Triado', 'Confirmado', 'Encerrado', 'Cancelado');
CREATE TYPE classificacao_risco_enum AS ENUM ('Não Urgente', 'Pouco Urgente', 'Urgente', 'Muito Urgente', 'Emergência');
CREATE TYPE cargo_profissional_enum AS ENUM ('Médico', 'Enfermeiro', 'Técnico de Enfermagem', 'Recepcionista', 'Outro');
CREATE TYPE perfil_acesso_enum AS ENUM ('Recepção', 'Enfermagem', 'Médico');

-- Gera o número do atendimento no formato AT0001
CREATE SEQUENCE seq_numero_atendimento;

CREATE TABLE paciente (
    id_paciente     UUID DEFAULT gen_random_uuid(),
    nome            VARCHAR(100) NOT NULL,
    cpf             CHAR(11),
    rg              VARCHAR(15),
    data_nascimento DATE,
    genero          VARCHAR(20),
    telefone        VARCHAR(15),
    CONSTRAINT pk_paciente PRIMARY KEY (id_paciente),
    CONSTRAINT uk_paciente_cpf UNIQUE (cpf)
);

CREATE TABLE profissional (
    id_profissional       UUID DEFAULT gen_random_uuid(),
    nome                  VARCHAR(100) NOT NULL,
    cpf                   CHAR(11) NOT NULL,
    cargo                 cargo_profissional_enum NOT NULL,
    registro_profissional VARCHAR(25),
    perfil                perfil_acesso_enum NOT NULL,
    usuario               VARCHAR(50) NOT NULL,
    senha_hash            VARCHAR(255) NOT NULL,
    CONSTRAINT pk_profissional PRIMARY KEY (id_profissional),
    CONSTRAINT uk_profissional_cpf UNIQUE (cpf),
    CONSTRAINT uk_profissional_usuario UNIQUE (usuario)
);

CREATE TABLE atendimento (
    id_atendimento      UUID DEFAULT gen_random_uuid(),
    id_paciente         UUID NOT NULL,
    id_profissional     UUID,
    data_hora_chegada   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_hora_saida     TIMESTAMPTZ,
    numero_atendimento  VARCHAR(11) DEFAULT 'AT' || LPAD(nextval('seq_numero_atendimento')::text, 4, '0') NOT NULL,
    status_atendimento  status_atendimento_enum DEFAULT 'Aberto' NOT NULL,
    motivo_atendimento  VARCHAR(255),
    CONSTRAINT pk_atendimento PRIMARY KEY (id_atendimento),
    CONSTRAINT uk_atendimento_numero UNIQUE (numero_atendimento),
    CONSTRAINT fk_atendimento_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente (id_paciente) ON DELETE RESTRICT,
    CONSTRAINT fk_atendimento_profissional FOREIGN KEY (id_profissional)
        REFERENCES profissional (id_profissional) ON DELETE RESTRICT
);

CREATE TABLE triagem (
    id_triagem          UUID DEFAULT gen_random_uuid(),
    id_atendimento      UUID NOT NULL,
    id_profissional     UUID NOT NULL,
    peso                NUMERIC(5,2),   -- kg
    altura              NUMERIC(3,2),   -- m
    pressao_sistolica   SMALLINT,       -- mmHg
    pressao_diastolica  SMALLINT,       -- mmHg
    temperatura         NUMERIC(4,1),   -- °C
    frequencia_cardiaca SMALLINT,       -- bpm
    sintomas_relatados  TEXT,
    classificacao_risco classificacao_risco_enum NOT NULL,
    data_hora_triagem   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_triagem PRIMARY KEY (id_triagem),
    CONSTRAINT uk_triagem_atendimento UNIQUE (id_atendimento),
    CONSTRAINT fk_triagem_atendimento FOREIGN KEY (id_atendimento)
        REFERENCES atendimento (id_atendimento) ON DELETE RESTRICT,
    CONSTRAINT fk_triagem_profissional FOREIGN KEY (id_profissional)
        REFERENCES profissional (id_profissional) ON DELETE RESTRICT,
    CONSTRAINT ck_triagem_peso        CHECK (peso > 0 AND peso < 500),
    CONSTRAINT ck_triagem_altura      CHECK (altura > 0 AND altura < 3),
    CONSTRAINT ck_triagem_temperatura CHECK (temperatura BETWEEN 25 AND 45),
    CONSTRAINT ck_triagem_freq        CHECK (frequencia_cardiaca BETWEEN 0 AND 300),
    CONSTRAINT ck_triagem_pressao     CHECK (pressao_sistolica >= pressao_diastolica)
);

CREATE TABLE medicacao (
    id_medicacao    UUID DEFAULT gen_random_uuid(),
    id_atendimento  UUID NOT NULL,
    id_profissional UUID NOT NULL,
    medicamento     VARCHAR(100) NOT NULL,
    dose            VARCHAR(50) NOT NULL,
    via             VARCHAR(30),
    observacao      VARCHAR(255),
    data_hora       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_medicacao PRIMARY KEY (id_medicacao),
    CONSTRAINT fk_medicacao_atendimento FOREIGN KEY (id_atendimento)
        REFERENCES atendimento (id_atendimento) ON DELETE RESTRICT,
    CONSTRAINT fk_medicacao_profissional FOREIGN KEY (id_profissional)
        REFERENCES profissional (id_profissional) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uk_atendimento_em_andamento
    ON atendimento (id_paciente)
    WHERE status_atendimento NOT IN ('Encerrado', 'Cancelado');