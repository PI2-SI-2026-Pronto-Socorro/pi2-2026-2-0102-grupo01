# Modelo Lógico do Banco de Dados

## 1. Relacionamento
- **PACIENTE (1) <--- (N) ATENDIMENTO**
  - Um paciente pode ter vários atendimentos (*1:N*).
  - Cada atendimento pertence a obrigatoriamente um paciente (*1:1*).

---

## 2. Tabelas

### 2.1. PACIENTE
Armazena os dados cadastrais do paciente.

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_paciente` | `INT` | `PK`, `AUTO_INCREMENT` | Identificador único do paciente |
| `nome` | `VARCHAR(100)` | `NOT NULL` | Nome completo |
| `cpf` | `VARCHAR(11)` | `UNIQUE`, `NOT NULL` | CPF (apenas números) |
| `data_nascimento` | `DATE` | `NOT NULL` | Data de nascimento |
| `genero` | `VARCHAR(20)` | - | Gênero do paciente |
| `telefone` | `VARCHAR(15)` | - | Telefone principal de contato |

---

### 2.2. ATENDIMENTO
Representa a entrada do paciente no Pronto Socorro (Geração do número de atendimento).

| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id_atendimento` | `INT` | `PK`, `AUTO_INCREMENT` | Número do atendimento |
| `id_paciente` | `INT` | `FK`, `NOT NULL` | Paciente que está sendo atendido (`PACIENTE.id_paciente`) |
| `data_hora_chegada` | `DATETIME` | `NOT NULL` | Data e hora exatas da recepção |
| `status` | `VARCHAR(30)` | `NOT NULL` | Status do atendimento |