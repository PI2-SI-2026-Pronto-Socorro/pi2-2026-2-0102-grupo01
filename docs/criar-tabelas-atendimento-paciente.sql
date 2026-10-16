CREATE TABLE paciente (
    id_paciente     NUMBER GENERATED ALWAYS AS IDENTITY,
    nome            VARCHAR2(100) NOT NULL,
    cpf             VARCHAR2(11) NOT NULL,
    data_nascimento DATE NOT NULL,
    genero          VARCHAR2(20),
    telefone        VARCHAR2(15),

    CONSTRAINT pk_paciente PRIMARY KEY (id_paciente),
    CONSTRAINT uk_paciente_cpf UNIQUE (cpf)
);

CREATE TABLE atendimento (
    id_atendimento    NUMBER GENERATED ALWAYS AS IDENTITY,
    id_paciente       NUMBER NOT NULL,
    data_hora_chegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status            VARCHAR2(30) NOT NULL,

    CONSTRAINT pk_atendimento PRIMARY KEY (id_atendimento),
    CONSTRAINT fk_atendimento_paciente FOREIGN KEY (id_paciente)
        REFERENCES paciente (id_paciente)
        ON DELETE CASCADE
);
