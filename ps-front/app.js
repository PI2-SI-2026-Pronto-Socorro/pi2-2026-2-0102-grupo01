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

if (botoesMenu.length) {
  botoesMenu.forEach((botao) => {
    botao.addEventListener('click', () => {
      mostrarPagina(botao.dataset.pagina);
    });
  });
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function montarCardPaciente(paciente) {
  const card = document.createElement('div');
  card.className = 'card-paciente';

  const tag = document.createElement('span');
  tag.className = 'tag-card';
  tag.textContent = 'Paciente encontrado';
  card.appendChild(tag);

  const titulo = document.createElement('h3');
  titulo.textContent = paciente.nome;
  card.appendChild(titulo);

  const dados = document.createElement('div');
  dados.className = 'dados-paciente';

  const campos = [
    ['CPF', paciente.cpf],
    ['Nascimento', formatarData(paciente.data_nascimento)],
    ['Telefone', paciente.telefone ?? '—'],
    ['Gênero', paciente.genero ?? '—'],
    ['Status', paciente.status ?? 'Sem atendimento'],
  ];

  campos.forEach(([label, valor]) => {
    const item = document.createElement('div');

    const legenda = document.createElement('span');
    legenda.textContent = label;

    const valorElemento = document.createElement('strong');
    valorElemento.textContent = valor;

    item.appendChild(legenda);
    item.appendChild(valorElemento);
    dados.appendChild(item);
  });

  card.appendChild(dados);
  return card;
}

if (formulario && resultado) {
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
      window.location.href = `./h03-cadastrar-paciente.html?cpf=${cpfDigitado}`;
    });
  });
}

if (paginas.length) {
  mostrarPagina('inicio');
}
