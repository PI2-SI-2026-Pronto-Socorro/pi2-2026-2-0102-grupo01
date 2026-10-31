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

formularioCadastro.addEventListener('submit', (event) => {
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

  mensagemCadastro.textContent = 'Dados validados no navegador. O envio e a confirmação do cadastro serão conectados ao back-end.';
  mensagemCadastro.classList.add('mensagem-aviso');
});
