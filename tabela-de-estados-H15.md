# Tabela de Estados e Transições do Atendimento (`H15.3`)

Este documento descreve o comportamento implementado no sistema para o ciclo de vida de um atendimento no Pronto-Socorro, incluindo os estados possíveis, as transições permitidas, as transições bloqueadas, as permissões por perfil e as regras de ordenação do painel médico.

> Especificação alinhada à **Parte 1**, **Parte 3**, **Parte 4**, **Parte 5** e **Parte 6** do Escopo do Projeto (Entregável **E11**) e validada pelos roteiros de teste **H15.2**, **H17.1** e **H17.2**.

---

## 1. Visão Geral do Ciclo de Vida

Cada atendimento recebe na abertura um identificador sequencial único no formato `AT0001`, `AT0002`, [...]. Mesmo que um atendimento seja cancelado, seu número permanece registrado no histórico e a numeração segue sequencialmente.

* **Fluxo unidirecional:** Não existem transições de retorno entre etapas anteriores.
* **Unicidade de atendimento ativo:** Um mesmo paciente (identificado pelo CPF) não pode possuir dois atendimentos em andamento simultaneamente nos estados `Aberto`, `Triado` ou `Confirmado`.

### Diagrama de Estados

| Estado Atual (De) | Próximo Estado (Para) | Ator | Ação / Evento | Regra / Observação |
| :--- | :--- | :--- | :--- | :--- |
| `Início [*]` | **Aberto** | Recepção | Cadastra o paciente e gera o nº (`AT0001`) | Início do fluxo de atendimento |
| **Aberto** | **Cancelado** | Recepção | Cancela o atendimento | Permitido somente antes da triagem |
| **Aberto** | **Triado** | Enfermagem | Registra sinais vitais, queixas e Protocolo de Manchester | Encaminha o paciente para a fila médica |
| **Triado** | **Confirmado** | Médico | Registra medicações e confirma o atendimento | Bloqueia alterações e consultas da Recepção |
| **Confirmado** | **Encerrado** | Médico | Dá alta ao paciente | Registra data e hora de saída |
| **Cancelado** | `Fim [*]` | Sistema | Finaliza o ciclo do atendimento | Estado final (apenas histórico) |
| **Encerrado** | `Fim [*]` | Sistema | Finaliza o ciclo do atendimento | Estado final (apenas histórico) |

---

## 2. Catálogo de Estados do Atendimento

| Estado | Classificação | Significado Operacional no Sistema | Visibilidade nas Filas / Painéis | Ações Permitidas sem Mudar o Estado |
| :--- | :--- | :--- | :--- | :--- |
| **`Aberto`** | Inicial | A recepção abriu o atendimento (cadastrando o paciente, reaproveitando cadastro via CPF e gerou o número sequencial; o paciente aguarda chamada para triagem. | Visível no **fila de triagem da Enfermagem**. Não aparece no painel médico. | **Recepção:** consultar e alterar dados cadastrais do paciente/atendimento. |
| **`Triado`** | Intermediário | A enfermagem registrou sinais vitais, queixa(s) e atribuiu a classificação de risco pelo Protocolo de Manchester. O paciente aguarda atendimento médico. | Visível no **Painel Médico** (atualizado automaticamente em tempo real), ordenado por gravidade e hora de chegada. Sai da fila da enfermagem. | **Recepção:** consultar e alterar dados cadastrais (alterações cadastrais não modificam o estado). |
| **`Confirmado`** | Intermediário | O médico acessou o atendimento, registrou medicações administradas e confirmou o atendimento. O paciente já foi atendido, mas aguarda alta para deixar o Pronto-Socorro. | Sai do **Painel Médico** (não está mais na fila de espera). | **Nenhuma** alteração ou consulta é permitida à Recepção. Os botões de edição/confirmação da etapa médica ficam bloqueados. |
| **`Cancelado`** | Final | A recepção cancelou o atendimento antes da realização da triagem (enquanto ainda estava em `Aberto`). | Removido de todas as filas operacionais; permanece apenas no **histórico**. | **Nenhuma** (registro imutável, somente leitura no histórico). |
| **`Encerrado`** | Final | O médico registrou a alta após a confirmação do atendimento; o sistema grava a data/hora de encerramento e conclui a passagem do paciente pelo Pronto-Socorro. | Removido de todas as filas operacionais; permanece apenas no **histórico**. | **Nenhuma** (registro imutável, somente leitura no histórico). |

---

## 3. Tabela de Transições Permitidas

| De | Para | Ator Responsável | Evento / Ação no Sistema | Pré-condições e Efeitos no Sistema |
| :--- | :--- | :--- | :--- | :--- |
| `(início)` | **`Aberto`** | **Recepção** | Cadastrar paciente e abrir atendimento | Dados pessoais preenchidos; paciente não possui outro atendimento ativo (`Aberto`, `Triado` ou `Confirmado`). O sistema grava data/hora de chegada e gera o identificador sequencial (`AT0001`). |
| **`Aberto`** | **`Cancelado`** | **Recepção** | Cancelar atendimento | O atendimento deve estar obrigatoriamente no estado `Aberto` (ainda não triado pela enfermagem). O registro passa para estado final e sai da fila de triagem. |
| **`Aberto`** | **`Triado`** | **Enfermagem** | Registrar triagem | Sinais vitais preenchidos dentro das faixas numéricas válidas (pressão arterial, temperatura, frequência cardíaca, peso, altura), ao menos uma queixa vinculada e classificação de risco de Manchester selecionada. O atendimento entra automaticamente no Painel Médico. |
| **`Triado`** | **`Confirmado`** | **Médico** | Confirmar atendimento | Atendimento no estado `Triado`, previamente aberto/travado para o médico responsável (impedindo acesso simultâneo por outro médico), com consulta e medicações administradas registradas. **Efeito:** revoga definitivamente a permissão da Recepção de consultar ou alterar o atendimento. |
| **`Confirmado`** | **`Encerrado`** | **Médico** | Dar alta ao paciente | O atendimento deve estar obrigatoriamente no estado `Confirmado`. O sistema registra a data e hora de encerramento e finaliza o ciclo do atendimento. |

---

## 4. Tabela de Transições Proibidas (Bloqueadas pelo Back-end)

Qualquer tentativa de executar as transições abaixo — seja pela interface gráfica ou por chamada direta às rotas do back-end — é recusada pelo sistema, mantendo o estado original do registro intacto.

| ID Teste | Transição Proibida | Ator / Origem da Tentativa | Regra de Negócio e Motivo da Recusa | Comportamento do Sistema |
| :--- | :--- | :--- | :--- | :--- |
| `TP-01` | `Triado` -> `Cancelado` | **Recepção** | Após a enfermagem concluir a triagem e inserir o paciente na fila médica, o cancelamento deixa de ser permitido operacionalmente. | Recusa o cancelamento e mantém o atendimento em `Triado`. |
| `TP-02` | `Confirmado` -> `Cancelado` | **Recepção** | O atendimento médico já foi realizado e confirmado; a Recepção já perdeu permissão de acesso e edição sobre o registro. | Bloqueia o acesso e recusa o cancelamento, mantendo o estado `Confirmado`. |
| `TP-03` | `Triado` -> `Aberto` | **Enfermagem** ou **Recepção** | O fluxo do atendimento é estritamente unidirecional; não existe retorno da triagem para a recepção nem re-triagem. | Recusa a operação e mantém o estado `Triado`. |
| `TP-04` | `Confirmado` -> `Triado` | **Médico** | Uma vez confirmado pelo médico, o atendimento não retorna para a fila de espera do painel médico. | Recusa a reversão e mantém o registro em `Confirmado` aguardando apenas a alta. |
| `TP-05` | `Cancelado` -> *Qualquer estado* | **Recepção**, **Enfermagem** ou **Médico** | `Cancelado` é um estado final; registros cancelados são preservados apenas para auditoria/histórico. | Bloqueia qualquer edição, triagem, confirmação ou alta. |
| `TP-06` | `Encerrado` -> *Qualquer estado* | **Recepção**, **Enfermagem** ou **Médico** | `Encerrado` é um estado final; após a alta médica o atendimento não pode ser reaberto ou alterado. | Bloqueia qualquer reabertura, cancelamento ou modificação. |
| `TP-07` | `Aberto` -> `Confirmado` | **Médico** | A etapa de triagem é obrigatória antes do atendimento médico; atendimentos não triados não existem no painel médico. | Não exibe o atendimento no painel e recusa qualquer tentativa de confirmação direta. |
| `TP-08` | `Triado` -> `Encerrado` | **Médico** | A alta médica exige que o atendimento tenha sido previamente registrado e confirmado (`Confirmado`). | Recusa a alta direta a partir de `Triado`. |

---

## 5. Matriz de Permissões por Perfil e Estado

| Ação no Sistema | `Aberto` | `Triado` | `Confirmado` | `Cancelado` | `Encerrado` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Recepção:** Cadastrar / Abrir atendimento | Permitido *(início)* | — | — | — | — |
| **Recepção:** Consultar atendimento | Permitido | Permitido | **Bloqueado** | Somente histórico | Somente histórico |
| **Recepção:** Alterar dados cadastrais | Permitido | Permitido | **Bloqueado** | **Bloqueado** | **Bloqueado** |
| **Recepção:** Cancelar atendimento | Permitido | **Bloqueado** | **Bloqueado** | **Bloqueado** | **Bloqueado** |
| **Enfermagem:** Registrar triagem | Permitido | **Bloqueado** *(sem re-triagem)* | **Bloqueado** | **Bloqueado** | **Bloqueado** |
| **Médico:** Visualizar no painel e chamar | **Bloqueado** | Permitido *(com trava de concorrência)* | **Bloqueado** | **Bloqueado** | **Bloqueado** |
| **Médico:** Registrar medicações e confirmar | **Bloqueado** | Permitido | **Bloqueado** | **Bloqueado** | **Bloqueado** |
| **Médico:** Dar alta ao paciente | **Bloqueado** | **Bloqueado** | Permitido | **Bloqueado** | **Bloqueado** |

---

## 6. Regras Complementares Ligadas aos Estados

1. **Ordenação e Desempate no Painel Médico (Estado `Triado`):**
   * O painel lista exclusivamente registros no estado `Triado`, exibindo a cor acompanhada do nome da classificação por extenso (acessibilidade para daltonismo).
   * **Critério primário (gravidade):** `Vermelho – Emergência` (0 min) > `Laranja – Muito Urgente` (10 min) > `Amarelo – Urgente` (50 min) > `Verde – Pouco Urgente` (120 min) > `Azul – Não Urgente` (240 min).
   * **Critério de desempate (mesma cor):** Ordem cronológica crescente pela **data e hora de chegada** (`data_hora_chegada`) registrada na recepção (quem chegou antes é exibido primeiro).
2. **Trava de Concorrência Médica:**
   * Quando um médico abre/chama um atendimento em `Triado`, o sistema trava o registro para aquele profissional, impedindo que outro médico abra ou confirme simultaneamente o mesmo atendimento.

---

## 7. Evidência de Validação

A máquina de estados documentada neste arquivo foi testada e aprovada em **23/11/2026** em ambiente limpo (*Windows 11 VM limpa*):

* **H15.2 (Transições Proibidas):** Aprovado — todas as tentativas de transições inválidas (`TP-01` a `TP-07`) foram recusadas pelo sistema.
* **H17.1 (Fluxo Completo, Cancelamento e Desempate Manchester):** Aprovado — validados o cancelamento em `Aberto` (`AT0001`), o desempate cronológico na cor `Amarelo – Urgente` (`AT0006` e `AT0007`), a priorização imediata de `Vermelho – Emergência` (`AT0008`), o bloqueio da Recepção após a confirmação médica e a conclusão em `Encerrado`.
* **H17.2 (Ensaio em Máquina Limpa):** Aprovado — execução completa desde o banco zerado (`AT0001`) com os perfis de exemplo (`maria.recepcao`, `eliana.enf`, `regina.medica`).
