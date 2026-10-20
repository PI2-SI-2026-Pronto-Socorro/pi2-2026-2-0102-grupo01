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
pronto-socorro/
├── index.html, style.css, script.js   → front-end
└── api/
    ├── main.py          → API ligada ao Oracle
    ├── main_mock.py     → API de teste sem banco
    ├── requirements.txt
    └── .env.example     → modelo do .env
```

# Passo a passo para subir o projeto em uma máquina limpa

1. Preparo do ambiente;
2. Configuração do banco de dados;
3. Back-end (API em Python);
4. Front-end (HTML, CSS e JavaScript puro).

## 1. Preparo do Ambiente

* **Python:** Baixe e instale o Python (o `pip` já vem incluído).

  Link: https://www.python.org/downloads/

* **Git:** Prepare o Git/GitHub para clonar o repositório do projeto.
* **Editor de Código:** Utilizamos o VSCode para realizar a codificação do projeto.

## 2. Configuração do Banco de Dados Oracle

Para configurar o banco de dados Oracle, é necessário criar uma conta, informando login e senha. Para isso, a Oracle solicita que o usuário insira um cartão de crédito. Entretanto, você pode escolher a opção sem custos.

1. Crie o banco e baixe o **Wallet** de conexão.
2. Extraia o Wallet numa pasta (ex.: `C:/wallet-ps`).
3. (Opcional) Instale o SQL Developer para visualizar e administrar o banco:

   https://www.oracle.com/br/database/sqldeveloper/

## 3. Configuração e Execução do Back-end (API)

O back-end precisa ser configurado primeiro para que o front-end tenha uma API para consumir.

1. **Clonar o repositório:**

```bash
git clone https://github.com/PI2-SI-2026-Pronto-Socorro/pi2-2026-2-0102-grupo01.git
cd pi2-2026-2-0102-grupo01
```

2. **Configurar as variáveis de ambiente:** em `api/`, copie `.env.example` para `.env` e preencha com os dados de conexão do banco Oracle e o caminho do Wallet.

3. **Instalar as dependências:**

```bash
cd api
python -m pip install -r requirements.txt
```

4. **Iniciar a API** (dentro de `api/`):

```bash
python -m uvicorn main:app --reload
```

A API ficará disponível em `http://localhost:8000`.

### Testar a conexão com o banco

* http://localhost:8000/pacientes → lista a tabela `paciente`
* http://localhost:8000/docs → testa todas as rotas

### Rodar sem banco

Para testar o sistema sem conexão com o Oracle, use a API de teste:

```bash
python -m uvicorn main_mock:app --reload
```

## 4. Configuração e Execução do Front-end

1. Abra uma **nova aba ou janela do terminal** (mantenha a API rodando na outra).
2. Na raiz do projeto, execute:

```bash
python -m http.server 5500
```

3. Acesse http://localhost:5500 no navegador.

Você também pode visualizar o front-end abrindo a pasta no VSCode e utilizando o Live Server para abrir o arquivo `index.html`.s