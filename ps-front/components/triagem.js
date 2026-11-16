const numeroTriagem = new URLSearchParams(window.location.search).get('numero');
const identificacaoAtendimento = document.getElementById('identificacao-atendimento');
const formTriagem = document.getElementById('form-triagem');
const mensagemTriagem = document.getElementById('mensagem-triagem');
const botaoConcluirTriagem = document.getElementById('concluir-triagem');

function mostrarMensagemTriagem(texto, tipo) {
  mensagemTriagem.textContent = texto;
  mensagemTriagem.className = `mensagem-triagem ${tipo}`;
  mensagemTriagem.setAttribute('role', tipo === 'mensagem-erro' ? 'alert' : 'status');
}

async function carregarAtendimento() {
  if (!numeroAtendimentoValido(numeroTriagem)) {
    identificacaoAtendimento.textContent = 'Número de atendimento ausente ou inválido.';
    mostrarMensagemTriagem('Volte à fila e selecione um atendimento válido.', 'mensagem-erro');
    botaoConcluirTriagem.disabled = true;
    return;
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/${encodeURIComponent(numeroTriagem.toUpperCase())}`);
  } catch {
    mostrarMensagemTriagem('Não foi possível conectar ao servidor. Tente novamente.', 'mensagem-erro');
    botaoConcluirTriagem.disabled = true;
    return;
  }

  const atendimento = await lerJson(resposta);
  if (!resposta.ok || !atendimento) {
    mostrarMensagemTriagem(
      atendimento?.detail ?? 'Não foi possível carregar o atendimento.',
      'mensagem-erro',
    );
    botaoConcluirTriagem.disabled = true;
    return;
  }

  identificacaoAtendimento.textContent = `${atendimento.numero_atendimento} · ${atendimento.nome}`;
  if (atendimento.status_atendimento !== 'Aberto') {
    mostrarMensagemTriagem('Este atendimento não está mais aguardando triagem.', 'mensagem-erro');
    botaoConcluirTriagem.disabled = true;
    return;
  }

  botaoConcluirTriagem.disabled = false;
}

formTriagem.addEventListener('submit', (event) => {
  event.preventDefault();
  if (botaoConcluirTriagem.disabled) return;

  mensagemTriagem.textContent = '';
  mensagemTriagem.className = 'mensagem-triagem';

  if (!formTriagem.checkValidity()) {
    formTriagem.reportValidity();
    mostrarMensagemTriagem('Confira os campos destacados antes de continuar.', 'mensagem-erro');
    return;
  }

  const sistolica = formTriagem.elements.pressao_sistolica.valueAsNumber;
  const diastolica = formTriagem.elements.pressao_diastolica.valueAsNumber;
  if (Number.isFinite(sistolica) && Number.isFinite(diastolica) && sistolica < diastolica) {
    mostrarMensagemTriagem('A pressão sistólica deve ser maior ou igual à pressão diastólica.', 'mensagem-erro');
    document.getElementById('pressao-sistolica').focus();
    return;
  }

  mostrarMensagemTriagem(
    'Triagem validada. Nenhum dado foi salvo: o envio ao atendimento pertence à etapa de integração.',
    'mensagem-aviso',
  );
});

carregarAtendimento();
