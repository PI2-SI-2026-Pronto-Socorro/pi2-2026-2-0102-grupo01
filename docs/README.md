# Passo a passo para subir o projeto em uma máquina limpa.
1. Preparo do ambiente;
2. Configuração do banco de dados;
3. Back-end (Node.JS);
4. Front-end (HTML e CSS puro).

## 1. Preparo do Ambiente

* **Node.js e npm:** Baixe e instale o Node.JS.
* O pacote NPM estará incluído.

  Link: https://nodejs.org/.

* **Git:** Prepare o Git/GitHub para clonar os repositórios do projeto.
* **Editor de Código:** Utilizamos o VSCode para realizar a codificação do projeto.

## 2. Configuração do Banco de Dados Oracle

Para configurar o banco de dados Oracle, é necessário criar uma conta, informando login e senha. Para isso, a Oracle solicita
que o usuário insira um cartão de crédito. Entretanto, você pode escolher a opção sem custos.  

Instale aqui: https://www.oracle.com/br/database/sqldeveloper/

## 3. Configuração e Execução do Back-end (Node.js)

O back-end precisa ser configurado primeiro para que o front-end tenha uma API para consumir.

1. **Clonar Repositório do GitHub:** Baixe o código e instale os pacotes.
Abra o terminal do VSCode e clone o repositório do back-end:

```bash
git clone <https://github.com/PI2-SI-2026-Pronto-Socorro/pi2-2026-2-0102-grupo01/tree/main/src>
cd <src>
npm install

```

2. **Configurar as Variáveis de Ambiente:** Crie e ajuste o arquivo .env.
Na raiz do projeto back-end, localize o arquivo de exemplo (geralmente `.env.example`) e renomeie-o para `.env`. Preencha com os dados de conexão do banco Oracle criado no passo anterior:

```env
PORT=3000
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_CONNECTION_STRING=localhost:1521/XEPDB1

```

3. **Executar Migrations e Iniciar o Servidor:** Prepare o banco e suba a API.
Caso o projeto utilize migrations (como Sequelize, Knex ou Prisma), execute-as para criar as tabelas automaticamente:

```bash
npm run migrate

```

Em seguida, inicie a aplicação em modo de desenvolvimento:

```bash
npm run dev

```

## 4. Configuração e Execução do Front-end

Com a API rodando, o front-end (seja React, Vue, Angular ou Vanilla) pode ser configurado.

1. Abra uma **nova aba ou janela do terminal** (mantenha o back-end rodando na outra).
2. Clone o repositório do front-end e instale as dependências:
```bash
git clone <url-do-repositorio-frontend>
cd <pasta-do-frontend>
npm install

```

3. Inicie o ambiente de desenvolvimento do front-end:
```bash
npm run dev

```

4. Você também pode visualizar o front-end do projeto abrindo a pasta no VS Code e utilizando o Live Server para abrir o arquivo index.html.


5. Acesse o endereço fornecido no terminal (geralmente `http://localhost:5173` ou `http://localhost:3000`) através do seu navegador.

---
