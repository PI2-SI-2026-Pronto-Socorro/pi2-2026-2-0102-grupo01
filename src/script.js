const pacientes = [
  {
    nome: 'Maria da Silva',
    cpf: '12345678900',
    dataNascimento: '14/03/1990',
    telefone: '(11) 98765-4321',
    convenio: 'Unimed',
    status: 'Em espera'
  },
  {
    nome: 'João Pereira',
    cpf: '98765432100',
    dataNascimento: '02/09/1987',
    telefone: '(19) 99123-4567',
    convenio: 'SulAmérica',
    status: 'Em atendimento'
  },
  {
    nome: 'Ana Souza',
    cpf: '45678912300',
    dataNascimento: '30/11/2002',
    telefone: '(11) 99876-5432',
    convenio: 'Particular',
    status: 'Alta'
  }
];

const paginas = document.querySelectorAll('.pagina');
const botoesMenu = document.querySelectorAll('[data-pagina]');
const formulario = document.getElementById('form-busca');
const resultado = document.getElementById('resultado');

function mostrarPagina(pagina) {
  paginas.forEach((item) => {
    const ativa = item.id === pagina;
    item.classList.toggle('ativa', ativa);
  });
}

botoesMenu.forEach((botao) => {
  botao.addEventListener('click', () => {
    mostrarPagina(botao.dataset.pagina);
  });
});

function montarCardPaciente(paciente) {
  const card = document.createElement('div');
  card.className = 'card-paciente';

  card.innerHTML = `
    <span class="tag-card">Paciente encontrado</span>
    <h3>${paciente.nome}</h3>
    <div class="dados-paciente">
      <div><span>CPF</span><strong>${paciente.cpf}</strong></div>
      <div><span>Nascimento</span><strong>${paciente.dataNascimento}</strong></div>
      <div><span>Telefone</span><strong>${paciente.telefone}</strong></div>
      <div><span>Convênio</span><strong>${paciente.convenio}</strong></div>
      <div><span>Status</span><strong>${paciente.status}</strong></div>
    </div>
  `;

  return card;
}

formulario.addEventListener('submit', (event) => {
  event.preventDefault();

  const cpfDigitado = document.getElementById('cpf').value.replace(/\D/g, '');

  if (!cpfDigitado) {
    resultado.innerHTML = '<p>Digite um CPF válido.</p>';
    return;
  }

  const paciente = pacientes.find((item) => item.cpf === cpfDigitado);

  if (paciente) {
    resultado.innerHTML = '';
    resultado.appendChild(montarCardPaciente(paciente));
    return;
  }

  resultado.innerHTML = `
    <div class="caixa-vazia">
      <p>CPF não encontrado na base atual.</p>
      <button type="button" class="botao-principal" id="botao-cadastrar">Cadastrar</button>
    </div>
  `;

  document.getElementById('botao-cadastrar').addEventListener('click', () => {
    alert('Cadastro do paciente será implementado depois.');
  });
});

mostrarPagina('inicio');
