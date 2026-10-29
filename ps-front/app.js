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
  card.className = 'card border-success-subtle';

  const corpo = document.createElement('div');
  corpo.className = 'card-body';
  card.appendChild(corpo);

  const tag = document.createElement('span');
  tag.className = 'badge text-bg-success';
  tag.textContent = 'Paciente encontrado';
  corpo.appendChild(tag);

  const titulo = document.createElement('h2');
  titulo.className = 'h5 mt-3 mb-3';
  titulo.textContent = paciente.nome;
  corpo.appendChild(titulo);

  const dados = document.createElement('div');
  dados.className = 'row row-cols-2 row-cols-md-3 g-3';

  const campos = [
    ['CPF', paciente.cpf],
    ['Nascimento', formatarData(paciente.data_nascimento)],
    ['Telefone', paciente.telefone ?? '—'],
    ['Gênero', paciente.genero ?? '—'],
    ['Status', paciente.status ?? 'Sem atendimento'],
  ];

  campos.forEach(([label, valor]) => {
    const item = document.createElement('div');
    item.className = 'col';

    const legenda = document.createElement('span');
    legenda.className = 'd-block small text-body-secondary';
    legenda.textContent = label;

    const valorElemento = document.createElement('strong');
    valorElemento.textContent = valor;

    item.appendChild(legenda);
    item.appendChild(valorElemento);
    dados.appendChild(item);
  });

  corpo.appendChild(dados);

  const linkFicha = document.createElement('a');
  linkFicha.className = 'btn btn-primary mt-3';
  linkFicha.href = `./h04-abrir-atendimento.html?cpf=${paciente.cpf}`;
  linkFicha.textContent = 'Abrir ficha';
  corpo.appendChild(linkFicha);

  return card;
}

if (formulario && resultado) {
  formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const cpfDigitado = document.getElementById('cpf').value.replace(/\D/g, '');

    if (cpfDigitado.length !== 11) {
      resultado.innerHTML = '<div class="alert alert-warning mb-0">Digite um CPF válido.</div>';
      return;
    }

    resultado.innerHTML = '<div class="d-flex align-items-center gap-2 text-body-secondary"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span>Buscando...</div>';

    let resposta;
    try {
      resposta = await fetch(`${API_URL}/pacientes/${cpfDigitado}`);
    } catch {
      resultado.innerHTML = '<div class="alert alert-danger mb-0">Não foi possível conectar à API.</div>';
      return;
    }

    if (resposta.ok) {
      const paciente = await resposta.json();
      resultado.innerHTML = '';
      resultado.appendChild(montarCardPaciente(paciente));
      return;
    }

    if (resposta.status !== 404) {
      resultado.innerHTML = '<div class="alert alert-danger mb-0">Erro ao buscar paciente.</div>';
      return;
    }

    resultado.innerHTML = `
      <div class="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0">
        <span>CPF não encontrado na base atual.</span>
        <button type="button" class="btn btn-primary" id="botao-cadastrar">Cadastrar paciente</button>
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
