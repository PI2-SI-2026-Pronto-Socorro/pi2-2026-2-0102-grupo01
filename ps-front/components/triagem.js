const parametrosTriagem = new URLSearchParams(window.location.search);
const numeroTriagem = parametrosTriagem.get('numero');
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
  if (!numeroTriagem || !/^AT\d{4,9}$/i.test(numeroTriagem)) {
    identificacaoAtendimento.textContent = 'Número de atendimento ausente ou inválido.';
    mostrarMensagemTriagem('Volte à fila e selecione um atendimento válido.', 'mensagem-erro');
    botaoConcluirTriagem.disabled = true;
    return;
  }

  const nome = parametrosTriagem.get('nome');
  identificacaoAtendimento.textContent = `${numeroTriagem.toUpperCase()}${nome ? ` · ${nome}` : ''}`;

  try {
    const resposta = await fetch(`/api/atendimentos/${encodeURIComponent(numeroTriagem.toUpperCase())}`);
    const atendimento = await resposta.json();
    if (!resposta.ok) {
      throw new Error(atendimento.detail || 'Não foi possível carregar o atendimento.');
    }
    if (atendimento.status_atendimento !== 'Aberto') {
      throw new Error('Este atendimento não está mais aguardando triagem.');
    }
  } catch (erro) {
    mostrarMensagemTriagem(erro.message, 'mensagem-erro');
    botaoConcluirTriagem.disabled = true;
  }
}

formTriagem.addEventListener('submit', (event) => {
  event.preventDefault();
  mensagemTriagem.textContent = '';
  mensagemTriagem.className = 'mensagem-triagem';

  if (!formTriagem.checkValidity()) {
    formTriagem.reportValidity();
    mostrarMensagemTriagem('Selecione uma classificação de risco e corrija os campos destacados.', 'mensagem-erro');
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
