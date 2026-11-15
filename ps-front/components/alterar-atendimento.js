const parametrosAlteracao = new URLSearchParams(window.location.search);
const numeroAlteracao = parametrosAlteracao.get('numero');
const identificacaoAlteracao = document.getElementById('identificacao-alteracao');
const dadosAlteracao = document.getElementById('dados-alteracao');
const formAlteracao = document.getElementById('form-alteracao');
const mensagemAlteracao = document.getElementById('mensagem-alteracao');
const botaoSalvarAlteracao = document.getElementById('salvar-alteracao');

function adicionarResumo(titulo, valor) {
  const item = document.createElement('div');
  item.className = 'resumo-alteracao';
  const legenda = document.createElement('span');
  legenda.textContent = titulo;
  const conteudo = document.createElement('strong');
  conteudo.textContent = valor || '—';
  item.append(legenda, conteudo);
  dadosAlteracao.appendChild(item);
}

async function carregarDadosAlteracao() {
  if (!numeroAtendimentoValido(numeroAlteracao)) {
    identificacaoAlteracao.textContent = 'Número de atendimento ausente ou inválido.';
    mensagemAlteracao.textContent = 'Abra a alteração a partir de uma consulta de atendimento válida.';
    mensagemAlteracao.classList.add('mensagem-erro');
    botaoSalvarAlteracao.disabled = true;
    return;
  }

  const numero = numeroAlteracao.toUpperCase();
  identificacaoAlteracao.textContent = `Atendimento ${numero}`;
  document.getElementById('voltar-consulta').href =
    `./h05-consultar-atendimento.html?numero=${encodeURIComponent(numero)}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/${encodeURIComponent(numero)}`);
  } catch {
    mensagemAlteracao.textContent = 'Não foi possível conectar ao servidor. Tente novamente.';
    mensagemAlteracao.classList.add('mensagem-erro');
    mensagemAlteracao.setAttribute('role', 'alert');
    botaoSalvarAlteracao.disabled = true;
    return;
  }

  const atendimento = await lerJson(resposta);
  if (!resposta.ok || !atendimento) {
    mensagemAlteracao.textContent =
      atendimento?.detail ?? 'Não foi possível carregar o atendimento.';
    mensagemAlteracao.classList.add('mensagem-erro');
    mensagemAlteracao.setAttribute('role', 'alert');
    botaoSalvarAlteracao.disabled = true;
    return;
  }

  adicionarResumo('Número', atendimento.numero_atendimento);
  adicionarResumo('Situação atual', atendimento.status_atendimento);
  adicionarResumo('Chegada', formatarDataHora(atendimento.data_hora_chegada));
  document.getElementById('status-atendimento').value = atendimento.status_atendimento;
}

formAlteracao.addEventListener('submit', (event) => {
  event.preventDefault();
  mensagemAlteracao.className = 'mensagem-alteracao';
  mensagemAlteracao.textContent = '';

  if (!formAlteracao.reportValidity()) return;

  mensagemAlteracao.textContent =
    'Alteração recusada: a API ainda não oferece atualização de atendimentos. Nenhum dado foi alterado.';
  mensagemAlteracao.classList.add('mensagem-erro');
  mensagemAlteracao.setAttribute('role', 'alert');
});

carregarDadosAlteracao();
