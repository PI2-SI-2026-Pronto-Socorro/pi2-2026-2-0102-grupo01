## Modelo Lógico, baseado no MER

Seguindo o modelo conceitual da imagem: entidades, atributos e as cardinalidades desenhadas. **PK** é chave primária, **FK** é chave estrangeira e **UK** é única.

---

#### PACIENTE

| Coluna          | Tipo         | Chave | Nulo? |
| --------------- | ------------ | ----- | ----- |
| id_paciente     | UUID         | PK    | NÃO   |
| nome            | VARCHAR(100) |       | NÃO   |
| data_nascimento | DATE         |       | SIM   |
| cpf             | CHAR(11)     | UK    | SIM   |
| genero          | VARCHAR(20)  |       | SIM   |
| telefone        | VARCHAR(15)  |       | SIM   |

#### PRONTUARIO

| Coluna        | Tipo        | Chave             | Nulo? |
| ------------- | ----------- | ----------------- | ----- |
| id_prontuario | UUID        | PK                | NÃO   |
| id_paciente   | UUID        | FK → PACIENTE, UK | NÃO   |
| data_abertura | TIMESTAMPTZ |                   | NÃO   |
| obs           | TEXT        |                   | SIM   |

#### PROFISSIONAL

| Coluna                | Tipo         | Chave | Nulo? |
| --------------------- | ------------ | ----- | ----- |
| id_profissional       | UUID         | PK    | NÃO   |
| nome                  | VARCHAR(100) |       | NÃO   |
| telefone              | VARCHAR(15)  |       | SIM   |
| cpf                   | CHAR(11)     | UK    | NÃO   |
| registro_profissional | VARCHAR(25)  | UK    | SIM   |
| plantao               | VARCHAR(50)  |       | SIM   |
| especialidade         | VARCHAR(80)  |       | SIM   |

#### CLASSIFICACAO_RISCO

| Coluna                | Tipo               | Chave | Nulo? |
| --------------------- | ------------------ | ----- | ----- |
| id_classificacao      | UUID               | PK    | NÃO   |
| gravidade             | VARCHAR(30)        |       | NÃO   |
| tempo_max_atendimento | SMALLINT (minutos) |       | NÃO   |

#### ATENDIMENTO

| Coluna            | Tipo        | Chave         | Nulo? |
| ----------------- | ----------- | ------------- | ----- |
| id_atendimento    | UUID        | PK            | NÃO   |
| id_paciente       | UUID        | FK → PACIENTE | NÃO   |
| data_hora_chegada | TIMESTAMPTZ |               | NÃO   |
| status            | VARCHAR(20) |               | NÃO   |

#### TRIAGEM

| Coluna           | Tipo         | Chave                    | Nulo? |
| ---------------- | ------------ | ------------------------ | ----- |
| id_triagem       | UUID         | PK                       | NÃO   |
| id_atendimento   | UUID         | FK → ATENDIMENTO, UK     | NÃO   |
| id_profissional  | UUID         | FK → PROFISSIONAL        | NÃO   |
| id_classificacao | UUID         | FK → CLASSIFICACAO_RISCO | NÃO   |
| pressao_arterial | VARCHAR(7)   |                          | SIM   |
| temperatura      | NUMERIC(4,1) |                          | SIM   |
| data_hora        | TIMESTAMPTZ  |                          | NÃO   |

#### QUEIXA

| Coluna          | Tipo        | Chave        | Nulo?                  |
| --------------- | ----------- | ------------ | ---------------------- |
| id_queixa       | UUID        | PK           | NÃO                    |
| id_triagem      | UUID        | FK → TRIAGEM | NÃO                    |
| sintomas        | TEXT        |              | NÃO                    |
| duracao_sintoma | VARCHAR(50) |              | SIM (opcional **(O)**) |

#### CONSULTA_MEDICA

| Coluna           | Tipo        | Chave            | Nulo? |
| ---------------- | ----------- | ---------------- | ----- |
| id_consulta      | UUID        | PK               | NÃO   |
| id_atendimento   | UUID        | FK → ATENDIMENTO | NÃO   |
| data_hora_inicio | TIMESTAMPTZ |                  | NÃO   |
| data_hora_fim    | TIMESTAMPTZ |                  | SIM   |
| diagnostico      | TEXT        |                  | SIM   |

#### INTERNACAO

| Coluna              | Tipo         | Chave                    | Nulo? |
| ------------------- | ------------ | ------------------------ | ----- |
| id_internacao       | UUID         | PK                       | NÃO   |
| id_consulta         | UUID         | FK → CONSULTA_MEDICA, UK | NÃO   |
| data_hora_indicacao | TIMESTAMPTZ  |                          | NÃO   |
| motivo              | VARCHAR(255) |                          | NÃO   |
| leito               | VARCHAR(20)  |                          | SIM   |

#### EXAME

| Coluna           | Tipo        | Chave                | Nulo? |
| ---------------- | ----------- | -------------------- | ----- |
| id_exame         | UUID        | PK                   | NÃO   |
| id_consulta      | UUID        | FK → CONSULTA_MEDICA | NÃO   |
| tipo             | VARCHAR(80) |                      | NÃO   |
| data_solicitacao | TIMESTAMPTZ |                      | NÃO   |
| data_realizacao  | TIMESTAMPTZ |                      | SIM   |
| resultado        | TEXT        |                      | SIM   |
| status           | VARCHAR(20) |                      | NÃO   |

#### PRESCRICAO

| Coluna        | Tipo        | Chave                | Nulo? |
| ------------- | ----------- | -------------------- | ----- |
| id_prescricao | UUID        | PK                   | NÃO   |
| id_consulta   | UUID        | FK → CONSULTA_MEDICA | NÃO   |
| data_hora     | TIMESTAMPTZ |                      | NÃO   |
| orientacoes   | TEXT        |                      | SIM   |

#### MEDICACAO

| Coluna            | Tipo         | Chave | Nulo? |
| ----------------- | ------------ | ----- | ----- |
| id_medicacao      | UUID         | PK    | NÃO   |
| nome_medicamento  | VARCHAR(100) |       | NÃO   |
| dose              | VARCHAR(50)  |       | SIM   |
| frequencia        | VARCHAR(50)  |       | SIM   |
| via_administracao | VARCHAR(30)  |       | SIM   |

#### PRESCRICAO_MEDICACAO (tabela associativa do N:N “composição”)

| Coluna        | Tipo | Chave               | Nulo? |
| ------------- | ---- | ------------------- | ----- |
| id_prescricao | UUID | PK, FK → PRESCRICAO | NÃO   |
| id_medicacao  | UUID | PK, FK → MEDICACAO  | NÃO   |

---

### Resumo dos relacionamentos

| Relacionamento | Entidade A          | Cardinalidade | Entidade B      | Onde fica a FK                 |
| -------------- | ------------------- | ------------- | --------------- | ------------------------------ |
| registro       | PRONTUARIO          | 1 : 1         | PACIENTE        | PRONTUARIO.id_paciente         |
| chegada        | PACIENTE            | 1 : N         | ATENDIMENTO     | ATENDIMENTO.id_paciente        |
| encaminhamento | ATENDIMENTO         | 1 : 1         | TRIAGEM         | TRIAGEM.id_atendimento         |
| execução       | PROFISSIONAL        | 1 : N         | TRIAGEM         | TRIAGEM.id_profissional        |
| ATRIBUI        | CLASSIFICACAO_RISCO | 1 : N         | TRIAGEM         | TRIAGEM.id_classificacao       |
| apresentação   | TRIAGEM             | 1 : N         | QUEIXA          | QUEIXA.id_triagem              |
| geração        | ATENDIMENTO         | 1 : N         | CONSULTA_MEDICA | CONSULTA_MEDICA.id_atendimento |
| indicação      | CONSULTA_MEDICA     | 1 : 1         | INTERNACAO      | INTERNACAO.id_consulta         |
| emissão        | CONSULTA_MEDICA     | 1 : N         | PRESCRICAO      | PRESCRICAO.id_consulta         |
| solicitação    | CONSULTA_MEDICA     | 1 : N         | EXAME           | EXAME.id_consulta              |
| composição     | PRESCRICAO          | N : N         | MEDICACAO       | tabela PRESCRICAO_MEDICACAO    |
