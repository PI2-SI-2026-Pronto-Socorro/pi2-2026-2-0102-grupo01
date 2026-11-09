const areaTriagem = document.getElementById('formulario-triagem');
const formTriagem = document.getElementById('form-registrar-triagem');
const mensagemTriagem = document.getElementById('mensagem-triagem');
const botaoCancelarTriagem = document.getElementById('cancelar-triagem');
const corpoFila = document.getElementById('fila-triagem');
const painelFila = corpoFila.closest('.table-panel');

const INTERVALO_ATUALIZACAO_MS = 30000;

// Estado da fila: evita buscas empilhadas e lembra se a tabela já mostra dados válidos.
let carregandoFila = false;
let filaJaCarregada = false;

// Atendimento escolhido na fila; a H08 vai usar o id_atendimento dele ao gravar a triagem.
let atendimentoSelecionado = null;

// Aviso pequeno, acima da tabela, para falhas nas atualizações automáticas.
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

// Na primeira carga o erro vai para a tabela. Depois, a lista que já está na tela
// continua valendo e a falha aparece só como aviso.
function mostrarFalhaFila(texto) {
  if (!filaJaCarregada) {
    mostrarEstadoFila(texto, true);
    return;
  }
  avisoAtualizacao.textContent = `${texto} Mostrando a última fila carregada; uma nova tentativa será feita em instantes.`;
  avisoAtualizacao.hidden = false;
}

async function carregarFila() {
  if (carregandoFila) return; // a busca anterior ainda não terminou
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
  formTriagem.reset();
  areaTriagem.hidden = false;
  areaTriagem.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

botaoCancelarTriagem.addEventListener('click', () => {
  atendimentoSelecionado = null;
  areaTriagem.hidden = true;
});

// O botão genérico abria o formulário sem paciente; a triagem agora começa sempre pela fila.
document.getElementById('visualizar-formulario-triagem').hidden = true;

mostrarEstadoFila('Carregando fila de triagem...');
carregarFila();
setInterval(carregarFila, INTERVALO_ATUALIZACAO_MS);

formTriagem.addEventListener('submit', (event) => {
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
  if (sistolica && diastolica && sistolica < diastolica) {
    mensagemTriagem.textContent = 'A pressão sistólica deve ser maior ou igual à diastólica.';
    mensagemTriagem.classList.add('mensagem-erro');
    return;
  }

  mensagemTriagem.textContent = 'Dados validados no navegador. O envio e a gravação serão conectados ao back-end.';
  mensagemTriagem.classList.add('mensagem-aviso');
});
