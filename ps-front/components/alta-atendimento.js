const corpoListaConfirmados = document.getElementById('lista-confirmados');
const mensagemAlta = document.getElementById('mensagem-alta');
const INTERVALO_ATUALIZACAO_ALTA_MS = 30000;

function mostrarMensagemAlta(textoMensagem, ehErro = false) {
  mensagemAlta.className = ehErro ? 'mensagem-erro' : 'mensagem-sucesso';
  mensagemAlta.setAttribute('role', ehErro ? 'alert' : 'status');
  mensagemAlta.textContent = textoMensagem;
  mensagemAlta.hidden = false;
}

function mostrarEstadoListaConfirmados(textoEstado, ehErro = false) {
  const linhaEstado = document.createElement('tr');
  const celulaEstado = document.createElement('td');
  celulaEstado.colSpan = 5;
  celulaEstado.className = ehErro ? 'estado-fila mensagem-erro' : 'estado-fila';
  celulaEstado.setAttribute('role', ehErro ? 'alert' : 'status');
  celulaEstado.textContent = textoEstado;
  linhaEstado.appendChild(celulaEstado);
  corpoListaConfirmados.replaceChildren(linhaEstado);
}

function montarLinhaConfirmado(atendimentoConfirmado) {
  const linhaAtendimento = document.createElement('tr');
  for (const valorCelula of [
    atendimentoConfirmado.numero_atendimento,
    atendimentoConfirmado.nome,
    formatarCpf(atendimentoConfirmado.cpf),
    formatarDataHora(atendimentoConfirmado.data_hora_chegada),
  ]) {
    const celula = document.createElement('td');
    celula.textContent = valorCelula ?? '-';
    linhaAtendimento.appendChild(celula);
  }

  const celulaAcao = document.createElement('td');
  const botaoDarAlta = document.createElement('button');
  botaoDarAlta.type = 'button';
  botaoDarAlta.className = 'primary-button';
  botaoDarAlta.innerHTML = '<span aria-hidden="true">✓</span>Dar alta';
  botaoDarAlta.addEventListener('click', () => darAltaAoAtendimento(atendimentoConfirmado, botaoDarAlta));
  celulaAcao.appendChild(botaoDarAlta);
  linhaAtendimento.appendChild(celulaAcao);
  return linhaAtendimento;
}

async function carregarListaConfirmados() {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/confirmados`);
  } catch {
    mostrarEstadoListaConfirmados('Não foi possível conectar à API.', true);
    return;
  }

  const listaConfirmados = await lerJson(resposta);
  if (!resposta.ok || !Array.isArray(listaConfirmados)) {
    mostrarEstadoListaConfirmados(listaConfirmados?.detail ?? 'Erro ao carregar os atendimentos confirmados.', true);
    return;
  }
  if (listaConfirmados.length === 0) {
    mostrarEstadoListaConfirmados('Nenhum atendimento aguardando alta.');
    return;
  }
  corpoListaConfirmados.replaceChildren(...listaConfirmados.map(montarLinhaConfirmado));
}

async function darAltaAoAtendimento(atendimentoConfirmado, botaoDarAlta) {
  const numeroAtendimento = atendimentoConfirmado.numero_atendimento;
  if (!window.confirm(`Dar alta ao atendimento ${numeroAtendimento} (${atendimentoConfirmado.nome})?`)) return;

  botaoDarAlta.disabled = true;
  try {
    let resposta;
    try {
      resposta = await fetch(`${API_URL}/atendimentos/${numeroAtendimento}/alta`, { method: 'POST' });
    } catch {
      mostrarMensagemAlta('Não foi possível conectar à API.', true);
      return;
    }

    const corpoResposta = await lerJson(resposta);
    if (!resposta.ok) {
      mostrarMensagemAlta(corpoResposta?.detail ?? 'Erro ao dar alta ao atendimento.', true);
      await carregarListaConfirmados();
      return;
    }

    mostrarMensagemAlta(
      `Alta registrada: atendimento ${numeroAtendimento} (${atendimentoConfirmado.nome}) encerrado em ${formatarDataHora(corpoResposta.data_hora_saida)}.`,
    );
    await carregarListaConfirmados();
  } finally {
    botaoDarAlta.disabled = false;
  }
}

mostrarEstadoListaConfirmados('Carregando atendimentos confirmados...');
carregarListaConfirmados();
setInterval(carregarListaConfirmados, INTERVALO_ATUALIZACAO_ALTA_MS);
