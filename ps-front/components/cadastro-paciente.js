const formularioCadastro = document.getElementById('form-cadastro-paciente');
const mensagemCadastro = document.getElementById('mensagem-cadastro');
const camposCadastro = {
  nome: document.getElementById('nome-completo'),
  cpf: document.getElementById('cpf'),
  data_nascimento: document.getElementById('data-nascimento'),
  genero: document.getElementById('genero'),
  telefone: document.getElementById('telefone'),
  rg: document.getElementById('rg'),
};

const cpfInicial = new URLSearchParams(window.location.search).get('cpf');
if (cpfInicial) {
  camposCadastro.cpf.value = cpfInicial.replace(/\D/g, '');
}

function mostrarErroCampo(campo, mensagem) {
  const erro = document.querySelector(`[data-erro="${campo}"]`);
  if (erro) erro.textContent = mensagem;
  camposCadastro[campo].setAttribute('aria-invalid', mensagem ? 'true' : 'false');
}

function validarCadastro(dados) {
  let valido = true;
  const cpfValido = /^\d{11}$/.test(dados.cpf) && !/^(\d)\1{10}$/.test(dados.cpf);

  Object.keys(camposCadastro).forEach((campo) => mostrarErroCampo(campo, ''));

  if (!dados.nome.trim()) {
    mostrarErroCampo('nome', 'Informe o nome completo.');
    valido = false;
  }
  if (!cpfValido) {
    mostrarErroCampo('cpf', 'Informe um CPF válido com 11 números.');
    valido = false;
  }
  if (!dados.data_nascimento) {
    mostrarErroCampo('data_nascimento', 'Informe a data de nascimento.');
    valido = false;
  } else if (new Date(`${dados.data_nascimento}T00:00:00`) > new Date()) {
    mostrarErroCampo('data_nascimento', 'A data de nascimento não pode ser futura.');
    valido = false;
  }

  return valido;
}

formularioCadastro.addEventListener('submit', async (event) => {
  event.preventDefault();
  mensagemCadastro.textContent = '';
  mensagemCadastro.className = 'campo largura-total';

  const dados = {
    nome: camposCadastro.nome.value.trim(),
    cpf: camposCadastro.cpf.value.replace(/\D/g, ''),
    data_nascimento: camposCadastro.data_nascimento.value,
    genero: camposCadastro.genero.value || null,
    telefone: camposCadastro.telefone.value.trim() || null,
    rg: camposCadastro.rg.value.trim() || null,
  };

  if (!validarCadastro(dados)) {
    mensagemCadastro.textContent = 'Revise os campos indicados antes de continuar.';
    mensagemCadastro.classList.add('mensagem-erro');
    return;
  }

  const botaoCadastrar = formularioCadastro.querySelector('[type="submit"]');
  botaoCadastrar.disabled = true;
  mensagemCadastro.textContent = 'Cadastrando paciente...';

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  } catch {
    mensagemCadastro.textContent = 'Não foi possível conectar à API.';
    mensagemCadastro.classList.add('mensagem-erro');
    botaoCadastrar.disabled = false;
    return;
  }

  if (resposta.ok) {
    // A confirmação é mostrada pela H02, que recebe o sinal "cadastrado=1".
    window.location.href = `./h02-buscar-paciente.html?cpf=${dados.cpf}&cadastrado=1`;
    return;
  }

  const erro = await lerJson(resposta);
  const detalhe = erro?.detail ?? 'Erro ao cadastrar paciente.';
  if (resposta.status === 409) mostrarErroCampo('cpf', detalhe);
  mensagemCadastro.textContent = detalhe;
  mensagemCadastro.classList.add('mensagem-erro');
  botaoCadastrar.disabled = false;
});
