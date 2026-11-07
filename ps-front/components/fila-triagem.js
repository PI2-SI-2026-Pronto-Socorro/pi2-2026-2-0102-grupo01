const areaTriagem = document.getElementById('formulario-triagem');
const formTriagem = document.getElementById('form-registrar-triagem');
const mensagemTriagem = document.getElementById('mensagem-triagem');
const botaoCancelarTriagem = document.getElementById('cancelar-triagem');
const corpoFila = document.getElementById('fila-triagem');

const INTERVALO_ATUALIZACAO_MS = 30000;

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function mostrarEstadoFila(texto, erro = false) {
  const linha = document.createElement('tr');
  const celula = document.createElement('td');
  celula.colSpan = 4;
  celula.className = erro ? 'estado-fila mensagem-erro' : 'estado-fila';
  celula.setAttribute('role', erro ? 'alert' : 'status');
  celula.textContent = texto;
  linha.appendChild(celula);
  corpoFila.replaceChildren(linha);
}

function montarLinhaFila(atendimento) {
  const linha = document.createElement('tr');
  for (const valor of [
    atendimento.numero_atendimento,
    atendimento.nome,
    formatarDataHora(atendimento.data_hora_chegada),
  ]) {
    const celula = document.createElement('td');
    celula.textContent = valor;
    linha.appendChild(celula);
  }

  const celulaAcao = document.createElement('td');
  const botaoTriar = document.createElement('button');
  botaoTriar.type = 'button';
  botaoTriar.className = 'botao-principal';
  botaoTriar.textContent = 'Iniciar triagem';
  botaoTriar.addEventListener('click', () => abrirFormularioTriagem(atendimento));
  celulaAcao.appendChild(botaoTriar);
  linha.appendChild(celulaAcao);

  return linha;
}

async function carregarFila() {
  let resposta;
  try {
    resposta = await fetch('/api/atendimentos/abertos');
  } catch {
    mostrarEstadoFila('Não foi possível conectar à API.', true);
    return;
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    mostrarEstadoFila(erro?.detail ?? 'Erro ao carregar a fila de triagem.', true);
    return;
  }

  const atendimentos = await resposta.json();
  if (atendimentos.length === 0) {
    mostrarEstadoFila('Nenhum paciente aguardando triagem.');
    return;
  }

  corpoFila.replaceChildren(...atendimentos.map(montarLinhaFila));
}

function abrirFormularioTriagem(atendimento) {
  document.getElementById('paciente-triagem').textContent = atendimento?.numero_atendimento
    ? `Atendimento ${atendimento.numero_atendimento} · ${atendimento.nome}`
    : 'Selecione um paciente na fila para iniciar a triagem.';
  mensagemTriagem.textContent = '';
  formTriagem.reset();
  areaTriagem.hidden = false;
  areaTriagem.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

botaoCancelarTriagem.addEventListener('click', () => {
  areaTriagem.hidden = true;
});

document.getElementById('visualizar-formulario-triagem').addEventListener('click', () => abrirFormularioTriagem());

mostrarEstadoFila('Carregando fila de triagem...');
carregarFila();
setInterval(carregarFila, INTERVALO_ATUALIZACAO_MS);

formTriagem.addEventListener('submit', (event) => {
  event.preventDefault();
  mensagemTriagem.className = 'mensagem-triagem';
  mensagemTriagem.textContent = '';

  if (!formTriagem.reportValidity()) return;

  const sistolica = Number(document.getElementById('pressao-sistolica').value);
  const diastolica = Number(document.getElementById('pressao-diastolica').value);
  if (sistolica && diastolica && sistolica < diastolica) {
    mensagemTriagem.textContent = 'A pressão sistólica deve ser maior ou igual à diastólica.';
    mensagemTriagem.classList.add('mensagem-erro');
    return;
  }

  mensagemTriagem.textContent = 'Dados validados no navegador. O envio e a gravação serão conectados ao back-end.';
  mensagemTriagem.classList.add('mensagem-aviso');
});
