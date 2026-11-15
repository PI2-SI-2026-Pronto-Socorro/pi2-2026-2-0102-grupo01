const areaTriagem = document.getElementById('formulario-triagem');
const formTriagem = document.getElementById('form-registrar-triagem');
const mensagemTriagem = document.getElementById('mensagem-triagem');
const botaoCancelarTriagem = document.getElementById('cancelar-triagem');
const corpoFila = document.getElementById('fila-triagem');
const painelFila = corpoFila.closest('.table-panel');

const INTERVALO_ATUALIZACAO_MS = 30000;

let carregandoFila = false;
let filaJaCarregada = false;

let atendimentoSelecionado = null;

const avisoAtualizacao = document.createElement('p');
avisoAtualizacao.className = 'aviso-triagem';
avisoAtualizacao.setAttribute('role', 'status');
avisoAtualizacao.hidden = true;
painelFila.before(avisoAtualizacao);

const mensagemSucessoFila = document.createElement('p');
mensagemSucessoFila.className = 'mensagem-sucesso';
mensagemSucessoFila.setAttribute('role', 'status');
mensagemSucessoFila.hidden = true;
painelFila.before(mensagemSucessoFila);

const botaoGravarTriagem = document.getElementById('botao-gravar-triagem');

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

function mostrarFalhaFila(texto) {
  if (!filaJaCarregada) {
    mostrarEstadoFila(texto, true);
    return;
  }
  avisoAtualizacao.textContent = `${texto} Mostrando a última fila carregada; uma nova tentativa será feita em instantes.`;
  avisoAtualizacao.hidden = false;
}

async function carregarFila() {
  if (carregandoFila) return;
  carregandoFila = true;
  try {
    let resposta;
    try {
      resposta = await fetch(`${API_URL}/atendimentos/abertos`);
    } catch {
      mostrarFalhaFila('Não foi possível conectar à API.');
      return;
    }

    const corpo = await lerJson(resposta);
    if (!resposta.ok || !Array.isArray(corpo)) {
      mostrarFalhaFila(corpo?.detail ?? 'Erro ao carregar a fila de triagem.');
      return;
    }

    filaJaCarregada = true;
    avisoAtualizacao.hidden = true;
    if (corpo.length === 0) {
      mostrarEstadoFila('Nenhum paciente aguardando triagem.');
      return;
    }
    corpoFila.replaceChildren(...corpo.map(montarLinhaFila));
  } finally {
    carregandoFila = false;
  }
}

function abrirFormularioTriagem(atendimento) {
  atendimentoSelecionado = atendimento;
  document.getElementById('paciente-triagem').textContent =
    `Atendimento ${atendimento.numero_atendimento} · ${atendimento.nome}`;
  mensagemTriagem.textContent = '';
  mensagemSucessoFila.hidden = true;
  formTriagem.reset();
  areaTriagem.hidden = false;
  areaTriagem.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

botaoCancelarTriagem.addEventListener('click', () => {
  atendimentoSelecionado = null;
  areaTriagem.hidden = true;
});

document.getElementById('visualizar-formulario-triagem').hidden = true;

mostrarEstadoFila('Carregando fila de triagem...');
carregarFila();
setInterval(carregarFila, INTERVALO_ATUALIZACAO_MS);

formTriagem.addEventListener('submit', async (event) => {
  event.preventDefault();
  mensagemTriagem.className = 'mensagem-triagem';
  mensagemTriagem.textContent = '';

  if (!atendimentoSelecionado) {
    mensagemTriagem.textContent = 'Selecione um paciente na fila para iniciar a triagem.';
    mensagemTriagem.classList.add('mensagem-erro');
    return;
  }

  if (!formTriagem.reportValidity()) return;

  const sistolica = Number(document.getElementById('pressao-sistolica').value);
  const diastolica = Number(document.getElementById('pressao-diastolica').value);
  if (sistolica < diastolica) {
    mensagemTriagem.textContent = 'A pressão sistólica deve ser maior ou igual à diastólica.';
    mensagemTriagem.classList.add('mensagem-erro');
    return;
  }

  const dadosTriagem = {
    id_profissional: document.getElementById('profissional-responsavel').value,
    classificacao_risco: document.getElementById('classificacao-risco').value,
    temperatura: Number(document.getElementById('temperatura').value),
    pressao_sistolica: sistolica,
    pressao_diastolica: diastolica,
    frequencia_cardiaca: Number(document.getElementById('frequencia-cardiaca').value),
    queixas: [{
      sintomas: document.getElementById('sintomas').value,
      duracao_sintoma: document.getElementById('duracao-sintoma').value,
    }],
  };

  await gravarTriagem(atendimentoSelecionado, dadosTriagem);
});

async function gravarTriagem(atendimento, dadosTriagem) {
  botaoGravarTriagem.disabled = true;
  try {
    let resposta;
    try {
      resposta = await fetch(`${API_URL}/atendimentos/${atendimento.numero_atendimento}/triagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosTriagem),
      });
    } catch {
      mostrarErroTriagem('Não foi possível conectar à API.');
      return;
    }

    const corpoResposta = await lerJson(resposta);
    if (!resposta.ok) {
      mostrarErroTriagem(corpoResposta?.detail ?? 'Erro ao gravar a triagem.');
      return;
    }

    atendimentoSelecionado = null;
    areaTriagem.hidden = true;
    mensagemSucessoFila.textContent =
      `Triagem do atendimento ${atendimento.numero_atendimento} (${atendimento.nome}) gravada como ${dadosTriagem.classificacao_risco}.`;
    mensagemSucessoFila.hidden = false;
    await carregarFila();
  } finally {
    botaoGravarTriagem.disabled = false;
  }
}

function mostrarErroTriagem(texto) {
  mensagemTriagem.className = 'mensagem-triagem mensagem-erro';
  mensagemTriagem.textContent = texto;
}

async function carregarProfissionais() {
  const campoProfissional = document.getElementById('profissional-responsavel');
  const opcaoInicial = new Option('Não foi possível carregar', '');
  try {
    const resposta = await fetch(`${API_URL}/profissionais`);
    const listaProfissionais = await lerJson(resposta);
    if (!resposta.ok || !Array.isArray(listaProfissionais)) {
      campoProfissional.replaceChildren(opcaoInicial);
      return;
    }
    opcaoInicial.textContent = listaProfissionais.length ? 'Selecione' : 'Nenhum profissional cadastrado';
    const opcoesProfissionais = listaProfissionais.map(
      (profissional) => new Option(`${profissional.nome} (${profissional.cargo})`, profissional.id_profissional),
    );
    campoProfissional.replaceChildren(opcaoInicial, ...opcoesProfissionais);
  } catch {
    campoProfissional.replaceChildren(opcaoInicial);
  }
}

carregarProfissionais();
