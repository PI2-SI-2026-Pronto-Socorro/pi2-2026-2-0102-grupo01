const parametros = new URLSearchParams(window.location.search);
const numeroAtendimento = (parametros.get('numero') ?? '').toUpperCase();
const identificacao = document.getElementById('identificacao-alteracao');
const formulario = document.getElementById('form-alteracao');
const mensagem = document.getElementById('mensagem-alteracao');
const botaoSalvar = document.getElementById('salvar-alteracao');
const voltarConsulta = document.getElementById('voltar-consulta');

function mostrarMensagem(texto, tipo = '') {
  mensagem.textContent = texto;
  mensagem.className = `mensagem-alteracao ${tipo}`.trim();
  mensagem.setAttribute('role', tipo === 'mensagem-erro' ? 'alert' : 'status');
}

function preencherFormulario(detalhes) {
  const { atendimento, paciente } = detalhes;
  document.getElementById('nome-paciente').value = paciente.nome ?? '';
  document.getElementById('cpf-paciente').value = paciente.cpf ? formatarCpf(paciente.cpf) : '';
  document.getElementById('data-nascimento').value = paciente.data_nascimento ?? '';
  document.getElementById('rg-paciente').value = paciente.rg ?? '';
  document.getElementById('genero-paciente').value = paciente.genero ?? '';
  document.getElementById('telefone-paciente').value = paciente.telefone ?? '';
  document.getElementById('motivo-atendimento').value = atendimento.motivo_atendimento ?? '';
}

async function carregarAtendimento() {
  if (!numeroAtendimentoValido(numeroAtendimento)) {
    identificacao.textContent = 'Número de atendimento ausente ou inválido.';
    mostrarMensagem('Abra a alteração a partir de uma consulta válida.', 'mensagem-erro');
    botaoSalvar.disabled = true;
    return;
  }

  identificacao.textContent = `Atendimento ${numeroAtendimento}`;
  voltarConsulta.href = `./h05-consultar-atendimento.html?numero=${encodeURIComponent(numeroAtendimento)}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/${encodeURIComponent(numeroAtendimento)}/detalhes`);
  } catch {
    mostrarMensagem('Não foi possível conectar à API.', 'mensagem-erro');
    botaoSalvar.disabled = true;
    return;
  }

  const detalhes = await lerJson(resposta);
  if (!resposta.ok || !detalhes?.atendimento || !detalhes?.paciente) {
    mostrarMensagem(detalhes?.detail ?? 'Não foi possível carregar o atendimento.', 'mensagem-erro');
    botaoSalvar.disabled = true;
    return;
  }

  if (['Confirmado', 'Encerrado', 'Cancelado'].includes(detalhes.atendimento.status_atendimento)) {
    mostrarMensagem(
      `Não é possível alterar um atendimento ${detalhes.atendimento.status_atendimento}.`,
      'mensagem-erro',
    );
    botaoSalvar.disabled = true;
  }
  preencherFormulario(detalhes);
}

formulario.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarMensagem('');
  if (!formulario.reportValidity()) return;

  const cpf = document.getElementById('cpf-paciente').value.replace(/\D/g, '');
  if (cpf.length !== 11) {
    mostrarMensagem('Informe um CPF válido com 11 números.', 'mensagem-erro');
    return;
  }

  const corpo = {
    nome: document.getElementById('nome-paciente').value.trim(),
    cpf,
    data_nascimento: document.getElementById('data-nascimento').value,
    rg: document.getElementById('rg-paciente').value.trim(),
    genero: document.getElementById('genero-paciente').value.trim(),
    telefone: document.getElementById('telefone-paciente').value.trim(),
    motivo_atendimento: document.getElementById('motivo-atendimento').value.trim(),
  };

  botaoSalvar.disabled = true;
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/${encodeURIComponent(numeroAtendimento)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  } catch {
    mostrarMensagem('Não foi possível conectar à API.', 'mensagem-erro');
    botaoSalvar.disabled = false;
    return;
  }

  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    mostrarMensagem(resultado?.detail ?? 'Não foi possível alterar o atendimento.', 'mensagem-erro');
    botaoSalvar.disabled = false;
    return;
  }

  window.location.href =
    `./h05-consultar-atendimento.html?numero=${encodeURIComponent(numeroAtendimento)}`;
});

carregarAtendimento();
