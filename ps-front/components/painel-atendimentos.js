const corpoPainel = document.querySelector('.table-panel tbody');
const contadoresPainel = {
  Aberto: document.querySelector('.stat-open strong'),
  Triado: document.querySelector('.stat-triaged strong'),
  Confirmado: document.querySelector('.stat-confirmed strong'),
  Encerrado: document.querySelector('.stat-closed strong'),
};

const CLASSE_STATUS = {
  Aberto: 'status-open',
  Triado: 'status-triaged',
  Confirmado: 'status-confirmed',
  Encerrado: 'status-closed',
  Cancelado: 'status-cancelled',
};

const INTERVALO_PAINEL_MS = 30000;

// Evita buscas empilhadas e lembra se a tabela já mostra dados válidos.
let carregandoPainel = false;
let painelJaCarregado = false;

// Aviso pequeno, acima da tabela, para falhas nas atualizações automáticas.
const avisoPainel = document.createElement('p');
avisoPainel.setAttribute('role', 'status');
avisoPainel.hidden = true;
corpoPainel?.closest('.table-panel')?.before(avisoPainel);

function formatarHoraPainel(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mostrarEstadoPainel(texto, erro = false) {
  const linha = document.createElement('tr');
  const celula = document.createElement('td');
  celula.colSpan = 6;
  celula.setAttribute('role', erro ? 'alert' : 'status');
  celula.textContent = texto;
  linha.appendChild(celula);
  corpoPainel.replaceChildren(linha);
}

function criarIconeVisualizar() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const olho = document.createElementNS(ns, 'path');
  olho.setAttribute('d', 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z');
  const pupila = document.createElementNS(ns, 'circle');
  pupila.setAttribute('cx', '12');
  pupila.setAttribute('cy', '12');
  pupila.setAttribute('r', '2.5');
  for (const forma of [olho, pupila]) {
    forma.setAttribute('stroke', 'currentColor');
    forma.setAttribute('stroke-width', '2');
    svg.appendChild(forma);
  }
  return svg;
}

function montarLinhaPainel(atendimento) {
  const linkConsulta = `./h05-consultar-atendimento.html?numero=${encodeURIComponent(atendimento.numero_atendimento)}`;
  const linha = document.createElement('tr');

  const celulaNumero = document.createElement('td');
  const numero = document.createElement('a');
  numero.className = 'appointment-number';
  numero.href = linkConsulta;
  numero.textContent = atendimento.numero_atendimento;
  celulaNumero.appendChild(numero);

  const celulaNome = document.createElement('td');
  celulaNome.textContent = atendimento.nome;

  const celulaCpf = document.createElement('td');
  celulaCpf.textContent = formatarCpf(atendimento.cpf);

  const celulaStatus = document.createElement('td');
  const etiqueta = document.createElement('span');
  etiqueta.className = `status-badge ${CLASSE_STATUS[atendimento.status_atendimento] ?? ''}`;
  etiqueta.append(document.createElement('span'), atendimento.status_atendimento);
  celulaStatus.appendChild(etiqueta);

  const celulaHora = document.createElement('td');
  celulaHora.textContent = formatarHoraPainel(atendimento.data_hora_chegada);

  const celulaAcoes = document.createElement('td');
  celulaAcoes.className = 'table-actions';
  const visualizar = document.createElement('a');
  visualizar.className = 'icon-button view-button';
  visualizar.href = linkConsulta;
  visualizar.setAttribute('aria-label', `Visualizar atendimento ${atendimento.numero_atendimento}`);
  visualizar.appendChild(criarIconeVisualizar());
  celulaAcoes.appendChild(visualizar);

  linha.append(celulaNumero, celulaNome, celulaCpf, celulaStatus, celulaHora, celulaAcoes);
  return linha;
}

function atualizarContadores(resumo) {
  for (const [status, elemento] of Object.entries(contadoresPainel)) {
    if (elemento) elemento.textContent = resumo?.[status] ?? 0;
  }
}

// Na primeira carga o erro vai para a tabela. Depois, os dados que já estão na tela
// continuam valendo e a falha aparece só como aviso.
function mostrarFalhaPainel(texto) {
  if (!painelJaCarregado) {
    mostrarEstadoPainel(texto, true);
    return;
  }
  avisoPainel.textContent = `${texto} Mostrando os últimos dados carregados; uma nova tentativa será feita em instantes.`;
  avisoPainel.hidden = false;
}

async function carregarPainel() {
  if (carregandoPainel) return; // a busca anterior ainda não terminou
  carregandoPainel = true;
  try {
    let resposta;
    try {
      resposta = await fetch(`${API_URL}/atendimentos/painel`);
    } catch {
      mostrarFalhaPainel('Não foi possível conectar à API.');
      return;
    }

    const corpo = await lerJson(resposta);
    if (!resposta.ok || !Array.isArray(corpo?.atendimentos)) {
      mostrarFalhaPainel(corpo?.detail ?? 'Erro ao carregar o painel de atendimentos.');
      return;
    }

    painelJaCarregado = true;
    avisoPainel.hidden = true;
    atualizarContadores(corpo.resumo);
    if (corpo.atendimentos.length === 0) {
      mostrarEstadoPainel('Nenhum atendimento hoje.');
      return;
    }
    corpoPainel.replaceChildren(...corpo.atendimentos.map(montarLinhaPainel));
  } finally {
    carregandoPainel = false;
  }
}

if (corpoPainel) {
  atualizarContadores(null);
  mostrarEstadoPainel('Carregando atendimentos...');
  carregarPainel();
  setInterval(carregarPainel, INTERVALO_PAINEL_MS);
}
