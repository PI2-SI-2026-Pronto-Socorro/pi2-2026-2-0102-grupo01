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

function formatarDataAlteracao(valor) {
  if (!valor) return '—';
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? '—'
    : data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

async function carregarDadosAlteracao() {
  if (!numeroAlteracao || !/^AT\d{4,9}$/i.test(numeroAlteracao)) {
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

  try {
    const resposta = await fetch(`/api/atendimentos/${encodeURIComponent(numero)}`);
    const atendimento = await resposta.json();
    if (!resposta.ok) {
      throw new Error(atendimento.detail || 'Não foi possível carregar o atendimento.');
    }

    adicionarResumo('Número', atendimento.numero_atendimento);
    adicionarResumo('Situação atual', atendimento.status_atendimento);
    adicionarResumo('Chegada', formatarDataAlteracao(atendimento.data_hora_chegada));
    document.getElementById('status-atendimento').value = atendimento.status_atendimento;
    document.getElementById('motivo-alteracao').value = atendimento.motivo_atendimento || '';
  } catch (erro) {
    identificacaoAlteracao.textContent = `Atendimento ${numero}`;
    mensagemAlteracao.textContent = erro.message;
    mensagemAlteracao.classList.add('mensagem-erro');
    mensagemAlteracao.setAttribute('role', 'alert');
    botaoSalvarAlteracao.disabled = true;
  }
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
