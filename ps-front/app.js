const API_URL = '/api';

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

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function montarCardPaciente(paciente) {
  const card = document.createElement('div');
  card.className = 'card-paciente';

  card.innerHTML = `
    <span class="tag-card">Paciente encontrado</span>
    <h3>${paciente.nome}</h3>
    <div class="dados-paciente">
      <div><span>CPF</span><strong>${paciente.cpf}</strong></div>
      <div><span>Nascimento</span><strong>${formatarData(paciente.data_nascimento)}</strong></div>
      <div><span>Telefone</span><strong>${paciente.telefone ?? '—'}</strong></div>
      <div><span>Gênero</span><strong>${paciente.genero ?? '—'}</strong></div>
      <div><span>Status</span><strong>${paciente.status ?? 'Sem atendimento'}</strong></div>
    </div>
  `;

  return card;
}

formulario.addEventListener('submit', async (event) => {
  event.preventDefault();

  const cpfDigitado = document.getElementById('cpf').value.replace(/\D/g, '');

  if (cpfDigitado.length !== 11) {
    resultado.innerHTML = '<p>Digite um CPF válido.</p>';
    return;
  }

  resultado.innerHTML = '<p>Buscando...</p>';

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/pacientes/${cpfDigitado}`);
  } catch {
    resultado.innerHTML = '<p>Não foi possível conectar à API.</p>';
    return;
  }

  if (resposta.ok) {
    const paciente = await resposta.json();
    resultado.innerHTML = '';
    resultado.appendChild(montarCardPaciente(paciente));
    return;
  }

  if (resposta.status !== 404) {
    resultado.innerHTML = '<p>Erro ao buscar paciente.</p>';
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
