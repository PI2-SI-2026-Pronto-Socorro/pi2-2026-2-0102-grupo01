const formularioBusca = document.getElementById('form-busca-atendimento');
const campoCpf = document.getElementById('cpf-atendimento');
const resultadoPaciente = document.getElementById('resultado-paciente');

function mostrarFichaPreparada(cpf) {
  resultadoPaciente.replaceChildren();
  const card = document.createElement('article');
  card.className = 'card-paciente';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Ficha do paciente';
  const cpfPaciente = document.createElement('p');
  cpfPaciente.textContent = `CPF consultado: ${cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`;
  const nomePaciente = document.createElement('p');
  nomePaciente.textContent = 'Os dados do paciente serão carregados após a integração com o back-end.';

  const botaoAbrir = document.createElement('button');
  botaoAbrir.className = 'botao-principal';
  botaoAbrir.type = 'button';
  botaoAbrir.disabled = true;
  botaoAbrir.textContent = 'Abrir atendimento';

  const mensagem = document.createElement('p');
  mensagem.className = 'mensagem-atendimento';
  mensagem.textContent = 'A abertura e a geração do número do atendimento dependem da integração com o back-end.';

  card.append(titulo, cpfPaciente, nomePaciente, botaoAbrir, mensagem);
  resultadoPaciente.appendChild(card);
}

formularioBusca.addEventListener('submit', (event) => {
  event.preventDefault();
  const cpf = campoCpf.value.replace(/\D/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    resultadoPaciente.innerHTML = '<p class="mensagem-erro" role="alert">Informe um CPF válido com 11 números.</p>';
    return;
  }

  mostrarFichaPreparada(cpf);
});

const pacienteInicial = new URLSearchParams(window.location.search);
const cpfInicial = pacienteInicial.get('cpf');
if (cpfInicial) {
  campoCpf.value = cpfInicial.replace(/\D/g, '');
}

const idPaciente = pacienteInicial.get('id_paciente');
if (idPaciente) {
  campoCpf.disabled = true;
  formularioBusca.querySelector('[type="submit"]').disabled = true;
  const card = document.createElement('article');
  card.className = 'card-paciente';
  const titulo = document.createElement('h2');
  titulo.textContent = pacienteInicial.get('nome') || 'Paciente selecionado';
  const aviso = document.createElement('p');
  aviso.textContent = 'Ficha pronta para receber os dados do back-end.';
  const botaoAbrir = document.createElement('button');
  botaoAbrir.className = 'botao-principal';
  botaoAbrir.type = 'button';
  botaoAbrir.disabled = true;
  botaoAbrir.textContent = 'Abrir atendimento';
  const mensagem = document.createElement('p');
  mensagem.className = 'mensagem-atendimento';
  mensagem.textContent = 'A abertura e a geração do número do atendimento serão conectadas ao back-end.';
  card.append(titulo, aviso, botaoAbrir, mensagem);
  resultadoPaciente.replaceChildren(card);
}
