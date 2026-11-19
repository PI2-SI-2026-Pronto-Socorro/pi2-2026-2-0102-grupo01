const corpoListaPainel = document.getElementById('lista-painel-atendimentos');
const rodapePainel = document.getElementById('rodape-painel-atendimentos');
const INTERVALO_ATUALIZACAO_PAINEL_MS = 30000;

const CLASSE_DO_STATUS = {
  Aberto: 'status-open',
  Triado: 'status-triaged',
  Confirmado: 'status-confirmed',
  Encerrado: 'status-closed',
  Cancelado: 'status-cancelled',
};

const CAMPO_TOTAL_DO_STATUS = {
  Aberto: 'total-abertos',
  Triado: 'total-triados',
  Confirmado: 'total-confirmados',
  Encerrado: 'total-encerrados',
};

function mostrarEstadoPainel(textoEstado, ehErro = false) {
  const linhaEstado = document.createElement('tr');
  const celulaEstado = document.createElement('td');
  celulaEstado.colSpan = 6;
  celulaEstado.className = ehErro ? 'mensagem-erro' : '';
  celulaEstado.setAttribute('role', ehErro ? 'alert' : 'status');
  celulaEstado.textContent = textoEstado;
  linhaEstado.appendChild(celulaEstado);
  corpoListaPainel.replaceChildren(linhaEstado);
}

function criarLinkConsulta(numeroAtendimento) {
  const linkConsulta = document.createElement('a');
  linkConsulta.className = 'appointment-number';
  linkConsulta.href = `./h05-consultar-atendimento.html?numero=${numeroAtendimento}`;
  linkConsulta.textContent = numeroAtendimento;
  return linkConsulta;
}

function criarSeloStatus(nomeStatus) {
  const seloStatus = document.createElement('span');
  seloStatus.className = `status-badge ${CLASSE_DO_STATUS[nomeStatus] ?? ''}`;
  seloStatus.append(document.createElement('span'), nomeStatus);
  return seloStatus;
}

function criarBotaoVisualizar(numeroAtendimento) {
  const botaoVisualizar = document.createElement('a');
  botaoVisualizar.className = 'icon-button view-button';
  botaoVisualizar.href = `./h05-consultar-atendimento.html?numero=${numeroAtendimento}`;
  botaoVisualizar.setAttribute('aria-label', `Visualizar atendimento ${numeroAtendimento}`);
  botaoVisualizar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="2" />'
    + '<circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="2" /></svg>';
  return botaoVisualizar;
}

function criarLinkAtendimentoMedico(numeroAtendimento) {
  const linkAtendimentoMedico = document.createElement('a');
  linkAtendimentoMedico.className = 'medical-action';
  linkAtendimentoMedico.href = `./h12-atendimento-medico.html?numero=${numeroAtendimento}`;
  linkAtendimentoMedico.textContent = 'Atendimento médico';
  return linkAtendimentoMedico;
}

function montarLinhaPainel(atendimentoDoPainel) {
  const linhaAtendimento = document.createElement('tr');
  const acoes = [
    criarBotaoVisualizar(atendimentoDoPainel.numero_atendimento),
  ];
  if (atendimentoDoPainel.status_atendimento === 'Triado') {
    acoes.unshift(criarLinkAtendimentoMedico(atendimentoDoPainel.numero_atendimento));
  }
  const conteudoDasCelulas = [
    criarLinkConsulta(atendimentoDoPainel.numero_atendimento),
    atendimentoDoPainel.nome,
    formatarCpf(atendimentoDoPainel.cpf),
    criarSeloStatus(atendimentoDoPainel.status_atendimento),
    formatarDataHora(atendimentoDoPainel.data_hora_chegada),
    acoes,
  ];
  conteudoDasCelulas.forEach((conteudoCelula, posicaoCelula) => {
    const celula = document.createElement('td');
    if (posicaoCelula === conteudoDasCelulas.length - 1) celula.className = 'table-actions';
    if (Array.isArray(conteudoCelula)) celula.append(...conteudoCelula);
    else celula.append(conteudoCelula ?? '-');
    linhaAtendimento.appendChild(celula);
  });
  return linhaAtendimento;
}

function mostrarTotaisDoDia(totaisDoDia) {
  for (const [nomeStatus, idCampoTotal] of Object.entries(CAMPO_TOTAL_DO_STATUS)) {
    document.getElementById(idCampoTotal).textContent = totaisDoDia?.[nomeStatus] ?? 0;
  }
}

async function carregarPainelAtendimentos() {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/painel`);
  } catch {
    mostrarEstadoPainel('Não foi possível conectar à API.', true);
    return;
  }

  const painelRecebido = await lerJson(resposta);
  if (!resposta.ok || !Array.isArray(painelRecebido?.atendimentos)) {
    mostrarEstadoPainel(painelRecebido?.detail ?? 'Erro ao carregar o painel de atendimentos.', true);
    return;
  }

  mostrarTotaisDoDia(painelRecebido.totais_do_dia);
  const listaAtendimentos = painelRecebido.atendimentos;
  rodapePainel.textContent = `${listaAtendimentos.length} atendimento(s) aguardando triagem ou confirmação`;
  if (listaAtendimentos.length === 0) {
    mostrarEstadoPainel('Nenhum atendimento aguardando triagem ou confirmação.');
    return;
  }
  corpoListaPainel.replaceChildren(...listaAtendimentos.map(montarLinhaPainel));
}

mostrarEstadoPainel('Carregando atendimentos...');
carregarPainelAtendimentos();
setInterval(carregarPainelAtendimentos, INTERVALO_ATUALIZACAO_PAINEL_MS);
