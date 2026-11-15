const corpoFila = document.getElementById('fila-triagem');
const botaoAtualizar = document.getElementById('atualizar-fila-triagem');
const painelFila = corpoFila.closest('.table-panel');
const intervaloAtualizacaoMs = 30000;

let carregandoFila = false;
let filaJaCarregada = false;

const avisoAtualizacao = document.createElement('p');
avisoAtualizacao.className = 'aviso-triagem';
avisoAtualizacao.setAttribute('role', 'status');
avisoAtualizacao.hidden = true;
painelFila.before(avisoAtualizacao);

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

function mostrarFalhaFila(texto) {
  if (!filaJaCarregada) {
    mostrarEstadoFila(texto, true);
    return;
  }
  avisoAtualizacao.textContent = `${texto} Mostrando a última fila carregada; uma nova tentativa será feita em instantes.`;
  avisoAtualizacao.hidden = false;
}

function formatarHora(valor) {
  if (!valor) return '—';
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? '—'
    : data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

function montarLinhaFila(atendimento) {
  const linha = document.createElement('tr');
  for (const valor of [
    atendimento.numero_atendimento,
    atendimento.nome || 'Nome indisponível',
    formatarHora(atendimento.data_hora_chegada),
  ]) {
    const celula = document.createElement('td');
    celula.textContent = valor || '—';
    linha.appendChild(celula);
  }

  const celulaAcao = document.createElement('td');
  const linkTriar = document.createElement('a');
  const parametros = new URLSearchParams({
    numero: atendimento.numero_atendimento,
    nome: atendimento.nome || '',
  });
  linkTriar.className = 'botao-triar';
  linkTriar.href = `./h08-triagem.html?${parametros.toString()}`;
  linkTriar.textContent = 'Triar';
  linkTriar.setAttribute('aria-label', `Abrir triagem de ${atendimento.nome || atendimento.numero_atendimento}`);
  celulaAcao.appendChild(linkTriar);
  linha.appendChild(celulaAcao);
  return linha;
}

async function carregarFila() {
  if (carregandoFila) return;
  carregandoFila = true;
  botaoAtualizar.disabled = true;
  try {
    let resposta;
    try {
      resposta = await fetch(`${API_URL}/atendimentos/abertos`);
    } catch {
      mostrarFalhaFila('Não foi possível conectar à API.');
      return;
    }

    const atendimentos = await lerJson(resposta);
    if (!resposta.ok || !Array.isArray(atendimentos)) {
      mostrarFalhaFila(atendimentos?.detail ?? 'Erro ao carregar a fila de triagem.');
      return;
    }

    filaJaCarregada = true;
    avisoAtualizacao.hidden = true;
    if (atendimentos.length === 0) {
      mostrarEstadoFila('Nenhum paciente aguardando triagem.');
      return;
    }
    corpoFila.replaceChildren(...atendimentos.map(montarLinhaFila));
  } finally {
    carregandoFila = false;
    botaoAtualizar.disabled = false;
  }
}

botaoAtualizar.addEventListener('click', carregarFila);
mostrarEstadoFila('Carregando fila de triagem...');
carregarFila();
setInterval(carregarFila, intervaloAtualizacaoMs);
