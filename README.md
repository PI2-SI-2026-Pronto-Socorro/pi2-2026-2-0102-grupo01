# PI2-SI-2026-Pronto_Socorro

Este repositório engloba o Projeto Integrador II, que está em fase de desenvolvimento para o curso de **Sistemas de Informação da PUC-Campinas**.

A solução desenvolvida será um **Sistema de Atendimentos de Pronto Socorro**.

## Integrantes

| Nome | GitHub |
|---|---|
| Angelina Elisa | [@AngelinaBueno](https://github.com/AngelinaBueno) |
| Ellen Samara | [@aellenb](https://github.com/aellenb) |
| Gabrielle Caixeta | [@caixetss](https://github.com/caixetss) |
| Ivan Henrique | [@Iwanhrq](https://github.com/Iwanhrq) |
| Julia Amorim da Silva | [@julia-amorim-silva](https://github.com/julia-amorim-silva) |
| Vicente Dei Santi | [@VicenteDeiSanti](https://github.com/VicenteDeiSanti) |

## Como contribuir

Antes de criar uma branch ou abrir um Pull Request, leia o [CONTRIBUTING.md](CONTRIBUTING.md): ele explica o padrão de nomes de branch, de mensagens de commit e o fluxo de PR.

## Estrutura do Projeto

```
pi2-2026-2-0102-grupo01/
├── README.md                                     → este arquivo
├── CONTRIBUTING.md                                → regras de branches, commits e PR
├── docs/
│   ├── escopo.pdf                                 → escopo do projeto
│   ├── MODELO-LOGICO-ATENDIMENTO-PACIENTE.md      → modelo lógico do banco
│   ├── banco-completo-script.sql                  → script de criação do banco completo
│   └── script-dados-teste.sql                     → testes do banco (roda e faz ROLLBACK)
├── ps-front/
│   ├── index.html                                 → página inicial da recepção
│   ├── app.js                                     → lógica da página H02 de busca por CPF
│   ├── style.css                                  → estilos globais do front-end
│   ├── css/
│   │   └── pages/                                 → estilos específicos das páginas hXX
│   └── h03-cadastrar-paciente.html                → tela de cadastro do paciente (H03)
├── ps-back/
│   ├── package.json                                → lista de dependências e comandos (npm run dev)
│   ├── .env.example                               → modelo do .env
│   └── src/
│       ├── server.js                               → ponto de entrada: carrega o .env, conecta ao banco e sobe o servidor
│       ├── app.js                                  → Express, middlewares globais, Swagger e rotas; também entrega o front-end
│       ├── routes/                                 → URLs da API
│       ├── controllers/                            → só HTTP: lê a requisição, chama o service e responde
│       ├── services/                               → regras de negócio (validações, CPF repetido, paciente existente)
│       ├── repositories/                           → só acesso ao banco (consultas com Drizzle)
│       ├── models/                                 → classes Paciente e Atendimento
│       ├── db/                                     → conexão (index.js), tabelas (schema.js)
│       ├── middlewares/                            → logger de requisições e tratamento de erros
│       ├── utils/                                  → erros de negócio e mapeamento de erros do PostgreSQL
│       └── docs/                                  → documentação da API (openapi.yaml), exibida pelo Swagger
└── ps-front/
    └── hXX-*.html                                 → demais páginas do front-end por história
```

Com o servidor rodando, a documentação da API fica em http://localhost:3000/api-docs.

## Passo a passo para subir o projeto em uma máquina limpa

1. Preparo do ambiente;
2. Configuração do banco de dados;
3. Execução da aplicação (back-end e front-end juntos).

## 1. Preparo do Ambiente

* **Node.js:** Baixe e instale a versão LTS do Node.js (o `npm` já vem incluído).

  Link: https://nodejs.org/

* **Git:** Prepare o Git/GitHub para clonar o repositório do projeto.
* **Editor de Código:** Utilizamos o VSCode para realizar a codificação do projeto.

## 2. Configuração do Banco de Dados PostgreSQL (Neon)

O banco de dados é um PostgreSQL hospedado no [Neon](https://neon.tech), que possui plano gratuito.

O grupo já utiliza um banco compartilhado. **Peça a `DATABASE_URL` a um integrante por mensagem privada** e pule para a etapa 3.

Para criar um banco novo:

1. Crie uma conta no Neon e clique em **New Project**.
2. Em **Region**, escolha **AWS South America East 1 (São Paulo)**.
3. Clique em **Connect**, deixe **Connection pooling** ligado e copie a URL de conexão.
4. Depois de criar o `.env` (etapa 3.2) e instalar as dependências (etapa 3.4), crie as tabelas com `npm run db:push` dentro de `ps-back`.

As tabelas são definidas só em `ps-back/src/db/schema.js`. Para alterar uma tabela, edite esse arquivo e rode `npm run db:push`: o drizzle-kit compara o schema com o banco e aplica a diferença.

## 3. Execução da Aplicação

O back-end também entrega o front-end, então **basta subir o back-end**. Não é preciso rodar o front-end separado.

### 3.1. Clonar o repositório

```bash
git clone https://github.com/PI2-SI-2026-Pronto-Socorro/pi2-2026-2-0102-grupo01.git
cd pi2-2026-2-0102-grupo01
```

### 3.2. Criar o arquivo `.env`

O `.env` guarda o endereço do banco. Ele não vem no repositório porque contém a senha.

1. No VSCode, abra a pasta `ps-back`.
2. Clique com o botão direito no arquivo `.env.example`, escolha **Copiar** e depois **Colar**.
3. Renomeie a cópia para `.env` (exatamente assim, começando com ponto).
4. Abra o `.env`, **selecione** o texto `COLE_AQUI_A_URL_DO_NEON` e cole a URL do banco **por cima**. A linha deve ficar assim:

```
DATABASE_URL=postgresql://usuario:senha@endereco.neon.tech/neondb?sslmode=require
```

5. Troque `COLE_AQUI_UM_SEGREDO_COM_32_OU_MAIS_CARACTERES` por um texto aleatório. Para gerar um, rode `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
6. Salve com `Ctrl + S`.

> O login é obrigatório (`AUTH_OBRIGATORIA=true`). O primeiro profissional de cada perfil (Recepção, Enfermagem, Médico) pode ser cadastrado sem login; depois disso, só um profissional logado do mesmo perfil cadastra outro.

> ⚠️ O `.env` **nunca** deve ser commitado (ele já está no `.gitignore`). A URL vai **só** no `.env`, nunca no `.env.example`.

### 3.3. Entrar na pasta `ps-back` pelo terminal

Todos os comandos `npm` precisam ser rodados **dentro de `ps-back`**:

```bash
cd ps-back
```

Confira o caminho que aparece no terminal. Ele deve terminar em `ps-back`:

```
PS C:\...\pi2-2026-2-0102-grupo01\ps-back>
```

### 3.4. Instalar as dependências

```bash
npm install
```

Esse comando baixa as bibliotecas do projeto para a pasta `node_modules`. Rode-o na primeira vez e **sempre depois de um `git pull`**, caso alguém tenha adicionado uma biblioteca nova.

### 3.5. Iniciar a aplicação

```bash
npm run dev
```

Abra no navegador: **http://localhost:3000**

* **Não** abra o `index.html` com dois cliques e **não** use o Live Server: a tela abre, mas não consegue falar com a API.
* Alterou algo no `ps-front`? Basta atualizar a página com `F5`.
* Alterou o `.env`? Reinicie o servidor: `Ctrl + C` e `npm run dev` de novo.

### 3.6. Testar a conexão com o banco

Abra http://localhost:3000/api/health. A página deve mostrar `{"banco":"ok"}`.

## Problemas comuns

| Erro | Causa | Solução |
|---|---|---|
| `Missing script: "dev"` | O terminal não está na pasta `ps-back`. | Rode `cd ps-back` e tente de novo. |
| `'nodemon' não é reconhecido` | As dependências não estão instaladas. | Rode `npm install` dentro de `ps-back`. |
| `Cannot find module '...'` | As dependências não estão instaladas ou estão incompletas. | Rode `npm install` dentro de `ps-back`. |
| Rotas respondendo `500` | A `DATABASE_URL` do `.env` está errada ou vazia. | Confira o `.env` e reinicie o servidor. |
| `relation "paciente" does not exist` | As tabelas não foram criadas no banco. | Rode `npm run db:push` dentro de `ps-back`. |

# Perfis de Usuário e Responsabilidades no Sistema

Este documento especifica os atores (perfis de acesso) do **Sistema de Atendimento de Pronto-Socorro**, detalhando suas responsabilidades em cada etapa do fluxo assistencial, as ações permitidas, as restrições e os critérios de rastreabilidade.
---

## 1. Visão Geral dos Perfis

O acesso ao sistema é controlado por autenticação individual (**usuário e senha**), vinculando cada profissional cadastrado a um dos três perfis operacionais abaixo. Essa vinculação permite ao back-end aplicar as regras de permissão e registrar automaticamente o profissional responsável em cada etapa do prontuário e do atendimento.

| Perfil | Etapa do Fluxo | Responsabilidade Central | Login de Exemplo (Homologação) |
| :--- | :--- | :--- | :--- |
| **Recepção** | **1. Recepção do atendimento** | Identificar/cadastrar o paciente, abrir o atendimento (`AT0001`), manter dados cadastrais e cancelar antes da triagem. | `maria.recepcao` |
| **Enfermagem** | **2. Triagem do atendimento** | Avaliar pacientes aguardando triagem, registrar sinais vitais e queixas e atribuir a classificação de risco (Protocolo de Manchester). | `eliana.enf` |
| **Médico** | **3. Atendimento médico** | Atender pacientes pela ordem de prioridade do painel, registrar diagnóstico e medicações, confirmar o atendimento e dar alta. | `regina.medica` |

---

## 2. Perfil: Recepção

A **Recepção** é a porta de entrada do paciente no Pronto-Socorro e atua exclusivamente na abertura, manutenção cadastral e eventual cancelamento inicial do atendimento.

### Ações Permitidas
* **Consultar paciente pelo CPF:** Antes de criar um novo cadastro, busca o CPF na base para reaproveitar o registro existente e preservar o histórico único do prontuário.
* **Cadastrar paciente:** Registra os dados pessoais completos.
* **Abrir atendimento e gerar senha:** Cria um novo atendimento no estado **`Aberto`**, registrando data/hora de chegada e gerando o número sequencial (`AT0001`, `AT0002`, ..., com reinício anual).
* **Consultar e alterar dados do atendimento/paciente:** Atualiza informações cadastrais ou corrige dados preenchidos incorretamente.
* **Cancelar atendimento:** Encerra o atendimento antes da triagem (mudando o estado para **`Cancelado`**), em casos de desistência na recepção.
* **Cadastrar profissionais (Administração simplificada):** Registra os dados básicos dos profissionais (nome, CPF, registro profissional e perfil/especialidade) para criação de acessos ao sistema.

### Regras de Negócio e Restrições
* **Bloqueio de atendimentos simultâneos:** Não pode abrir um novo atendimento para um paciente que já possua um atendimento ativo nos estados `Aberto`, `Triado` ou `Confirmado`.
* **Janela de cancelamento:** O cancelamento só é permitido enquanto o atendimento estiver no estado **`Aberto`** (antes da triagem). Após a triagem (`Triado`), o cancelamento é bloqueado pelo sistema.
* **Janela de consulta e alteração:** Pode consultar e alterar os dados cadastrais enquanto o atendimento estiver em **`Aberto`** ou **`Triado`** (inclusive durante a triagem, sem alterar o estado do atendimento).
* **Perda de acesso após confirmação médica:** Assim que o médico confirma o atendimento (estado **`Confirmado`**), a Recepção perde definitivamente o direito de consultar ou alterar aquele registro.

---

## 3. Perfil: Enfermagem

A **Enfermagem** é responsável pela avaliação clínica inicial e pela classificação de risco que organiza a fila de prioridade médica.

### Ações Permitidas
* **Visualizar fila de triagem:** Acessa a lista de atendimentos que estão no estado **`Aberto`** aguardando classificação.
* **Registrar sinais vitais:** Insere os parâmetros clínicos do paciente em campos numéricos validados (peso, altura, pressão arterial em mmHg, temperatura corporal em °C e frequência cardíaca em bpm).
* **Registrar queixas:** Seleciona ou vincula uma ou mais queixas relatadas pelo paciente (ex.: dor de cabeça, náusea, enjoo, dor muscular, suor excessivo).
* **Classificar risco (Protocolo de Manchester):** Define manualmente a cor de prioridade clínica com base nos sinais vitais e queixas avaliados, transicionando o atendimento de **`Aberto`** para **`Triado`** e enviando-o automaticamente para o Painel Médico.

### Escala de Classificação Utilizada pela Enfermagem
| Cor | Nível de Urgência | Tempo Máximo de Espera | Prioridade no Painel |
| :--- | :--- | :--- | :--- |
| **Vermelho** | Emergência | `0 minutos` (Imediato) | 1ª (Máxima) |
| **Laranja** | Muito Urgente | `10 minutos` | 2ª |
| **Amarelo** | Urgente | `50 minutos` | 3ª |
| **Verde** | Pouco Urgente | `120 minutos` (2 horas) | 4ª |
| **Azul** | Não Urgente | `240 minutos` (4 horas) | 5ª (Mínima) |

### Regras de Negócio e Restrições
* **Unicidade da triagem (sem re-triagem):** Cada atendimento comporta no máximo uma triagem. Não é permitido realizar uma nova triagem no mesmo atendimento caso o paciente piore na sala de espera.
* **Fluxo unidirecional:** Após concluir a triagem (`Triado`), a Enfermagem não pode cancelar o atendimento nem devolvê-lo para o estado `Aberto` (Recepção).
* **Validação de faixas numéricas:** O sistema impede o registro de sinais vitais fora das faixas numéricas válidas ou com campos obrigatórios vazios.

---

## 4. Perfil: Médico

O **Médico** realiza o atendimento clínico propriamente dito, administra medicações, valida a conclusão do atendimento e autoriza a saída do paciente da unidade.

### Ações Permitidas
* **Visualizar o Painel Médico:** Acompanha a fila de atendimentos no estado **`Triado`**, exibindo a cor acompanhada do texto por extenso (acessibilidade para daltonismo).
* **Chamar e visualizar detalhes do atendimento:** Abre um atendimento da fila para visualizar os sinais vitais e as queixas registradas pela Enfermagem.
* **Registrar consulta e conduta médica:** Preenche diagnóstico, observações clínicas, procedimentos realizados, solicitação de exames, prescrição/receita médica e eventual indicação de internação.
* **Registrar medicações administradas:** Documenta os medicamentos aplicados no paciente durante o atendimento no Pronto-Socorro.
* **Confirmar o atendimento:** Conclui a etapa clínica (transicionando de **`Triado`** para **`Confirmado`**), removendo o paciente da fila de espera e bloqueando o acesso da Recepção.
* **Dar alta ao paciente:** Registra a saída do paciente do Pronto-Socorro (transicionando de **`Confirmado`** para **`Encerrado`**) e grava a data/hora de encerramento.

### Regras de Negócio e Restrições
* **Ordenação e desempate da fila:** O painel médico ordena os atendimentos primeiro pela gravidade do Protocolo de Manchester (Vermelho > Laranja > Amarelo > Verde > Azul) e, em caso de **mesma cor**, desempata pela **data e hora de chegada** (quem chegou primeiro aparece antes).
* **Ordem obrigatória entre Confirmação e Alta:** O médico não pode dar alta diretamente a um paciente em `Triado`; é obrigatório registrar as medicações e **confirmar** o atendimento (`Confirmado`) antes de acionar a **alta** (`Encerrado`).
* **Imutabilidade após alta e confirmação:** Após a confirmação, os botões de edição/confirmação da etapa médica são bloqueados; após a alta (`Encerrado`), o registro torna-se histórico imutável.

---

## 5. Resumo Comparativo de Permissões por Perfil

| Funcionalidade / Ação | Recepção | Enfermagem | Médico |
| :--- | :---: | :---: | :---: |
| Cadastrar / buscar paciente e abrir atendimento (`AT`) | Sim | Não | Não |
| Consultar e alterar dados cadastrais (antes da confirmação médica) | Sim | Não | Não |
| Cancelar atendimento (apenas no estado `Aberto`) | Sim | Não | Não |
| Visualizar fila de espera para triagem (`Aberto`) | Não | Sim | Não |
| Registrar sinais vitais, queixas e classificação de Manchester | Não | Sim | Não |
| Visualizar Painel Médico ordenado (`Triado`) | Não | Não | Sim |
| Registrar diagnóstico, consulta e medicações administradas | Não | Não | Sim |
| Confirmar atendimento (bloqueando a Recepção) | Não | Não | Sim |
| Dar alta médica e encerrar atendimento (`Encerrado`) | Não | Não | Sim |
