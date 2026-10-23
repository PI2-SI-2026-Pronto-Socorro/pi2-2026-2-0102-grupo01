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
├── docs/
│   └── criar-tabelas-atendimento-paciente.sql  → script de criação das tabelas
├── ps-front/
│   └── index.html, style.css, app.js           → front-end
└── ps-back/
    ├── server.js       → API (Node + Express), também serve o front-end
    ├── db.js           → conexão com o banco
    ├── schema.js       → tabelas descritas para o Drizzle ORM
    ├── package.json
    └── .env.example    → modelo do .env
```

# Passo a passo para subir o projeto em uma máquina limpa

1. Preparo do ambiente;
2. Configuração do banco de dados;
3. Back-end e front-end (Node.js, HTML, CSS e JavaScript puro).

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

O projeto não usa migrations: qualquer alteração em tabela deve ser feita no banco (pelo SQL Editor), no script em `docs/` e no `ps-back/schema.js`.

## 3. Configuração e Execução da Aplicação

A API em Node também entrega o front-end, então basta subir o back-end.

1. **Clonar o repositório:**

```bash
git clone https://github.com/PI2-SI-2026-Pronto-Socorro/pi2-2026-2-0102-grupo01.git
cd pi2-2026-2-0102-grupo01
```

2. **Configurar as variáveis de ambiente:** em `ps-back/`, copie `.env.example` para `.env` e substitua `COLE_AQUI_A_URL_DO_NEON` pela URL do banco. A URL deve terminar com `?sslmode=require`.

   > O `.env` contém a senha do banco e **nunca** deve ser commitado (ele já está no `.gitignore`). Não coloque a URL no `.env.example`.

3. **Instalar as dependências:**

```bash
cd ps-back
npm install
```

4. **Iniciar a aplicação** (dentro de `ps-back/`):

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

Sempre que o `.env` for alterado, reinicie o servidor (`Ctrl + C` e `npm run dev`).

### Testar a conexão com o banco

* http://localhost:3000/api/pacientes → lista a tabela `paciente`

### Problemas comuns

| Erro | Solução |
|---|---|
| `Missing script: "dev"` | O comando foi rodado fora da pasta `ps-back`. |
| `Cannot find module '...'` | Rode `npm install` dentro de `ps-back`. |
| Rotas respondendo `500` | Confira a `DATABASE_URL` no `.env` e reinicie o servidor. |
| `relation "paciente" does not exist` | Rode o script de `docs/` no SQL Editor do Neon. |
