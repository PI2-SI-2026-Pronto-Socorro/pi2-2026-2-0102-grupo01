# Modelo Lógico do Banco de Dados

## 1. Relacionamentos
- **PACIENTE (1) <--- (N) ATENDIMENTO**
  - Um paciente pode ter vários atendimentos (*1:N*).
  - Cada atendimento pertence obrigatoriamente a um paciente.
- **PROFISSIONAL (1) <--- (N) ATENDIMENTO**
  - O médico responsável pelo atendimento. Fica vazio até um médico assumir o atendimento.
- **ATENDIMENTO (1) <--- (1) TRIAGEM**
  - Cada atendimento tem no máximo uma triagem.
- **PROFISSIONAL (1) <--- (N) TRIAGEM**
  - A enfermeira que fez a triagem.
- **ATENDIMENTO (1) <--- (N) MEDICACAO**
  - Um atendimento pode ter várias medicações registradas pelo médico.
- **PROFISSIONAL (1) <--- (N) MEDICACAO**
  - O médico que registrou a medicação.

---

## 2. Tipos enumerados

| Tipo | Valores |
| :--- | :--- |
| `status_atendimento_enum` | Aberto, Triado, Confirmado, Encerrado, Cancelado |
| `classificacao_risco_enum` | Não Urgente, Pouco Urgente, Urgente, Muito Urgente, Emergência |
| `cargo_profissional_enum` | Médico, Enfermeiro, Técnico de Enfermagem, Recepcionista, Outro |
| `perfil_acesso_enum` | Recepção, Enfermagem, Médico |

---

## 3. Tabelas

### 3.1. PACIENTE
Armazena os dados cadastrais do paciente.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_paciente` | `UUID` | `PK` | Identificador único do paciente |
| `nome` | `VARCHAR(100)` | `NOT NULL` | Nome completo |
| `cpf` | `CHAR(11)` | `UNIQUE` | CPF (apenas números); vazio para paciente não identificado |
| `rg` | `VARCHAR(15)` | - | RG |
| `data_nascimento` | `DATE` | - | Data de nascimento; vazia para paciente não identificado |
| `genero` | `VARCHAR(20)` | - | Gênero do paciente |
| `telefone` | `VARCHAR(15)` | - | Telefone principal de contato |

---

### 3.2. PROFISSIONAL
Profissionais que usam o sistema.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_profissional` | `UUID` | `PK` | Identificador único do profissional |
| `nome` | `VARCHAR(100)` | `NOT NULL` | Nome completo |
| `cpf` | `CHAR(11)` | `UNIQUE`, `NOT NULL` | CPF (apenas números) |
| `cargo` | `cargo_profissional_enum` | `NOT NULL` | Cargo |
| `registro_profissional` | `VARCHAR(25)` | - | CRM, COREN etc. |
| `perfil` | `perfil_acesso_enum` | `NOT NULL` | Telas que o profissional vê |
| `usuario` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Usuário de login |
| `senha_hash` | `VARCHAR(255)` | `NOT NULL` | Hash da senha (nunca a senha em texto puro) |

---

### 3.3. ATENDIMENTO
Representa a entrada do paciente no Pronto Socorro.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_atendimento` | `UUID` | `PK` | Identificador único do atendimento |
| `id_paciente` | `UUID` | `FK`, `NOT NULL` | Paciente atendido (`PACIENTE.id_paciente`) |
| `id_profissional` | `UUID` | `FK` | Médico responsável (`PROFISSIONAL.id_profissional`) |
| `data_hora_chegada` | `TIMESTAMPTZ` | `NOT NULL` | Data e hora da recepção |
| `data_hora_saida` | `TIMESTAMPTZ` | - | Data e hora da alta |
| `numero_atendimento` | `VARCHAR(11)` | `UNIQUE`, `NOT NULL` | Número no formato AT0001, gerado pela sequência `seq_numero_atendimento` |
| `status_atendimento` | `status_atendimento_enum` | `NOT NULL`, padrão `Aberto` | Situação do atendimento |
| `motivo_atendimento` | `VARCHAR(255)` | - | Motivo informado na recepção |

Índice único parcial `uk_atendimento_em_andamento`: um paciente só pode ter um atendimento que não esteja Encerrado nem Cancelado.

---

### 3.4. TRIAGEM
Avaliação inicial feita pela enfermagem.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_triagem` | `UUID` | `PK` | Identificador único da triagem |
| `id_atendimento` | `UUID` | `FK`, `UNIQUE`, `NOT NULL` | Atendimento triado (`ATENDIMENTO.id_atendimento`) |
| `id_profissional` | `UUID` | `FK`, `NOT NULL` | Enfermeira que fez a triagem |
| `peso` | `NUMERIC(5,2)` | entre 0 e 500 | Peso em kg |
| `altura` | `NUMERIC(3,2)` | entre 0 e 3 | Altura em m |
| `pressao_sistolica` | `SMALLINT` | maior ou igual à diastólica | Pressão sistólica em mmHg |
| `pressao_diastolica` | `SMALLINT` | - | Pressão diastólica em mmHg |
| `temperatura` | `NUMERIC(4,1)` | entre 25 e 45 | Temperatura em °C |
| `frequencia_cardiaca` | `SMALLINT` | entre 0 e 300 | Batimentos por minuto |
| `sintomas_relatados` | `TEXT` | - | Queixas do paciente |
| `classificacao_risco` | `classificacao_risco_enum` | `NOT NULL` | Classificação de Manchester |
| `data_hora_triagem` | `TIMESTAMPTZ` | `NOT NULL` | Data e hora da triagem |

---

### 3.5. MEDICACAO
Medicações registradas pelo médico no atendimento.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_medicacao` | `UUID` | `PK` | Identificador único da medicação |
| `id_atendimento` | `UUID` | `FK`, `NOT NULL` | Atendimento (`ATENDIMENTO.id_atendimento`) |
| `id_profissional` | `UUID` | `FK`, `NOT NULL` | Médico que registrou |
| `medicamento` | `VARCHAR(100)` | `NOT NULL` | Nome do medicamento |
| `dose` | `VARCHAR(50)` | `NOT NULL` | Dose |
| `via` | `VARCHAR(30)` | - | Via de administração |
| `observacao` | `VARCHAR(255)` | - | Observação |
| `data_hora` | `TIMESTAMPTZ` | `NOT NULL` | Data e hora do registro |

Todas as chaves estrangeiras usam `ON DELETE RESTRICT`, para não apagar histórico clínico.
