const formularioConsulta = document.getElementById('form-consulta-atendimento');
const identificadorAtendimento = document.getElementById('identificador-atendimento');
const resultadoConsulta = document.getElementById('resultado-consulta');

function adicionarDado(container, titulo, valor) {
  const item = document.createElement('div');
  item.className = 'dado-atendimento';
  const legenda = document.createElement('span');
  legenda.textContent = titulo;
  const conteudo = document.createElement('strong');
  conteudo.textContent = valor;
  item.append(legenda, conteudo);
  container.appendChild(item);
}

function mostrarConsultaPreparada(valor) {
  const card = document.createElement('article');
  card.className = 'card-atendimento';
  const titulo = document.createElement('h2');
  titulo.textContent = 'Dados do atendimento';

  const dados = document.createElement('div');
  dados.className = 'dados-atendimento';
  adicionarDado(dados, 'Número / CPF consultado', valor);
  adicionarDado(dados, 'Situação', 'Aguardando integração');
  adicionarDado(dados, 'Data e hora de chegada', 'Aguardando integração');
  adicionarDado(dados, 'Dados do paciente', 'Aguardando integração');

  const aviso = document.createElement('p');
  aviso.className = 'aviso-consulta';
  aviso.textContent = 'A consulta foi validada no navegador. Os dados reais serão carregados após a integração com o back-end.';
  card.append(titulo, dados, aviso);
  resultadoConsulta.replaceChildren(card);
}

formularioConsulta.addEventListener('submit', (event) => {
  event.preventDefault();
  const valor = identificadorAtendimento.value.trim().toUpperCase();
  const numeros = valor.replace(/\D/g, '');

  if (/^AT\d{4,9}$/.test(valor)) {
    mostrarConsultaPreparada(valor);
    return;
  }

  if (numeros.length === 11 && !/^(\d)\1{10}$/.test(numeros)) {
    mostrarConsultaPreparada(numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
    return;
  }

  resultadoConsulta.innerHTML = '<p class="mensagem-erro" role="alert">Informe um número no formato AT0001 ou um CPF válido.</p>';
});

const numeroInicial = new URLSearchParams(window.location.search).get('numero');
if (numeroInicial) {
  identificadorAtendimento.value = numeroInicial;
  formularioConsulta.requestSubmit();
}
