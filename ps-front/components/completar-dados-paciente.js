const formulario = document.getElementById('form-completar-dados-paciente');
const mensagem = document.getElementById('mensagem-complemento');
const campos = {
  nome: document.getElementById('nome-completo'),
  cpf: document.getElementById('cpf'),
  data_nascimento: document.getElementById('data-nascimento'),
  genero: document.getElementById('genero'),
  telefone: document.getElementById('telefone'),
  rg: document.getElementById('rg'),
};

const cpfInicial = new URLSearchParams(window.location.search).get('cpf');
let cpfAtual = cpfInicial ? cpfInicial.replace(/\D/g, '') : '';
let pacienteEncontrado = false;

function mostrarMensagem(texto, tipo = '') {
  mensagem.textContent = texto;
  mensagem.className = `campo largura-total ${tipo}`.trim();
  mensagem.setAttribute('role', tipo === 'mensagem-erro' ? 'alert' : 'status');
}

async function carregarPaciente() {
  if (!/^\d{11}$/.test(cpfAtual)) return;
  campos.cpf.value = cpfAtual;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/pacientes/${cpfAtual}`);
  } catch {
    mostrarMensagem('Não foi possível conectar à API.', 'mensagem-erro');
    return;
  }

  const paciente = await lerJson(resposta);
  if (!resposta.ok || !paciente) {
    mostrarMensagem(paciente?.detail ?? 'Não foi possível carregar o paciente.', 'mensagem-erro');
    return;
  }

  campos.nome.value = paciente.nome ?? '';
  campos.cpf.value = paciente.cpf ?? cpfAtual;
  campos.data_nascimento.value = paciente.data_nascimento ?? '';
  campos.genero.value = paciente.genero ?? '';
  campos.telefone.value = paciente.telefone ?? '';
  campos.rg.value = paciente.rg ?? '';
  pacienteEncontrado = true;
}

formulario.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarMensagem('');

  const dados = {
    nome: campos.nome.value.trim(),
    cpf: campos.cpf.value.replace(/\D/g, ''),
    data_nascimento: campos.data_nascimento.value,
    genero: campos.genero.value || null,
    telefone: campos.telefone.value.trim() || null,
    rg: campos.rg.value.trim() || null,
  };

  if (!dados.nome) {
    mostrarMensagem('Informe o nome completo.', 'mensagem-erro');
    return;
  }
  if (!cpfComDigitosValidos(dados.cpf)) {
    mostrarMensagem('Informe um CPF válido com 11 números.', 'mensagem-erro');
    return;
  }
  if (!dados.data_nascimento) {
    mostrarMensagem('Informe a data de nascimento.', 'mensagem-erro');
    return;
  }
  if (new Date(`${dados.data_nascimento}T00:00:00`) > new Date()) {
    mostrarMensagem('A data de nascimento não pode ser futura.', 'mensagem-erro');
    return;
  }

  const botao = formulario.querySelector('[type="submit"]');
  botao.disabled = true;
  mostrarMensagem('Salvando dados...');

  const jaExiste = pacienteEncontrado;
  let resposta;
  try {
    resposta = await fetch(jaExiste ? `${API_URL}/pacientes/${cpfAtual}` : `${API_URL}/pacientes`, {
      method: jaExiste ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  } catch {
    mostrarMensagem('Não foi possível conectar à API.', 'mensagem-erro');
    botao.disabled = false;
    return;
  }

  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    mostrarMensagem(resultado?.detail ?? 'Não foi possível salvar os dados do paciente.', 'mensagem-erro');
    botao.disabled = false;
    return;
  }

  window.location.href = `./h02-buscar-paciente.html?cpf=${dados.cpf}&cadastrado=1`;
});

carregarPaciente();
