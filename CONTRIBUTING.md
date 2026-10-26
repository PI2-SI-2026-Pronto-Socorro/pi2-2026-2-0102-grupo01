# Como contribuir

Padrão de branches, commits e Pull Requests do projeto.

## Regra principal

A branch `main` é protegida: **não dá para dar `git push` direto nela**. Toda mudança entra por **Pull Request**, com **1 aprovação** de outra pessoa do grupo. Ninguém consegue aprovar o próprio PR.

## Fluxo de trabalho

1. Atualize a `main` e crie sua branch a partir dela:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/backend-h07
   ```
2. Programe e faça os commits:
   ```bash
   git add .
   git commit -m "[H07.1] feat: finaliza atendimento"
   ```
3. Envie a branch para o GitHub:
   ```bash
   git push -u origin feat/backend-h07
   ```
4. Abra o Pull Request para a `main` e preencha o modelo que aparece.
5. Peça revisão no grupo.
6. Depois de aprovado, clique em **Merge**.

Se o `git push` der erro com *"Changes must be made through a pull request"*, você está tentando enviar direto para a `main`. Crie uma branch e siga o fluxo acima.

## Nome das branches

Formato: `tipo/area-historias`

| Exemplo | Quando usar |
|---|---|
| `feat/backend-h02-h06` | Funcionalidades das histórias H02 a H06 no back-end |
| `feat/frontend-cadastro-h03` | Tela de cadastro (H03) no front-end |
| `fix/backend-busca-cpf` | Correção de um bug na busca por CPF |
| `docs/readme-instalacao` | Mudança só na documentação |

Regras:

- Tudo em minúsculo, sem acento e sem espaço (use hífen `-`).
- Diga a área: `backend` ou `frontend`.
- Coloque o código da(s) história(s) quando tiver (`h02`, `h03-h05`...).

## Mensagens de commit

Formato: `[Código da história] tipo: o que foi feito`

| Exemplo |
|---|
| `[H04.2] feat: recusa segundo atendimento em andamento para o mesmo paciente` |
| `[H05.1] feat: busca atendimento pelo número ou pelo CPF do paciente` |
| `fix: corrige erro 500 na busca por CPF` |
| `docs: atualiza README com o passo a passo` |

Regras:

- Escreva no presente e diga **o que** mudou ("adiciona", "corrige", "remove").
- Comece com letra minúscula depois do `tipo:`.
- Um commit = uma mudança. Evite commits gigantes com várias coisas misturadas.
- Evite mensagens vagas como "ajustes", "teste" ou "agora vai".

## Tipos

Valem para o nome da branch e para o commit. Seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/).

| Tipo | Quando usar |
|---|---|
| `feat` | Funcionalidade nova |
| `fix` | Correção de bug |
| `refactor` | Reorganiza o código sem mudar o que ele faz |
| `docs` | Só documentação (README, Swagger...) |
| `style` | Só formatação (espaços, ponto e vírgula) |
| `chore` | Configuração, dependências, `.gitignore` |

## Pull Requests

- Um PR por história ou grupo de histórias relacionadas.
- Preencha o modelo: o que foi feito, como testar e o checklist.
- Quando alguém pedir revisão, revise assim que puder para ninguém ficar travado.
- Se o PR mudar o banco (tabela, coluna, índice), avise no PR o SQL que precisa ser rodado na branch `main` do Neon.
