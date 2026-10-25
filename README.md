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

## Estrutura do Projeto

```
pi2-2026-2-0102-grupo01/
├── README.md                                   → este arquivo
├── docs/
│   ├── escopo.pdf                              → escopo do projeto
│   ├── MODELO-LOGICO-ATENDIMENTO-PACIENTE.md   → modelo lógico do banco
│   └── criar-tabelas-atendimento-paciente.sql  → script de criação das tabelas
├── ps-front/
│   └── index.html, style.css, app.js           → front-end (a tela)
└── ps-back/
    ├── package.json    → lista de dependências e comandos (npm run dev)
    ├── .env.example    → modelo do .env
    └── src/
        ├── server.js       → ponto de entrada: carrega o .env, conecta ao banco e sobe o servidor
        ├── app.js          → Express, middlewares globais, Swagger e rotas; também entrega o front-end
        ├── routes/         → URLs da API
        ├── controllers/    → só HTTP: lê a requisição, chama o service e responde
        ├── services/       → regras de negócio (validações, CPF repetido, paciente existente)
        ├── repositories/   → só acesso ao banco (consultas com Drizzle)
        ├── models/         → classes Paciente e Atendimento
        ├── db/             → conexão (index.js), tabelas (schema.js) e criação das tabelas (bootstrap.js)
        ├── middlewares/    → logger de requisições e tratamento de erros
        ├── utils/          → erros de negócio e mapeamento de erros do PostgreSQL
        └── docs/           → documentação da API (openapi.yaml), exibida pelo Swagger
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
3. Abra o **SQL Editor**, cole o conteúdo de `docs/criar-tabelas-atendimento-paciente.sql` e clique em **Run**.
4. Clique em **Connect**, deixe **Connection pooling** ligado e copie a URL de conexão.

O projeto não usa migrations: qualquer alteração em tabela deve ser feita em **três lugares**: no banco (pelo SQL Editor), no script em `docs/` e no `ps-back/schema.js`.

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

5. Salve com `Ctrl + S`.

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

Abra http://localhost:3000/api/pacientes. A página deve mostrar a lista de pacientes. Se o banco ainda não tiver nenhum paciente, aparece `[]` (uma lista vazia), o que é normal.

## Problemas comuns

| Erro | Causa | Solução |
|---|---|---|
| `Missing script: "dev"` | O terminal não está na pasta `ps-back`. | Rode `cd ps-back` e tente de novo. |
| `'nodemon' não é reconhecido` | As dependências não estão instaladas. | Rode `npm install` dentro de `ps-back`. |
| `Cannot find module '...'` | As dependências não estão instaladas ou estão incompletas. | Rode `npm install` dentro de `ps-back`. |
| Rotas respondendo `500` | A `DATABASE_URL` do `.env` está errada ou vazia. | Confira o `.env` e reinicie o servidor. |
| `relation "paciente" does not exist` | As tabelas não foram criadas no banco. | Rode o script de `docs/` no SQL Editor do Neon. |
