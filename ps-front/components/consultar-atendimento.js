const formularioConsulta = document.getElementById('form-consulta-atendimento');
const identificadorAtendimento = document.getElementById('identificador-atendimento');
const resultadoConsulta = document.getElementById('resultado-consulta');

function formatarCpf(cpf) {
  return cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não informado';
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function mostrarMensagem(texto, erro = false) {
  const paragrafo = document.createElement('p');
  paragrafo.textContent = texto;
  if (erro) {
    paragrafo.className = 'mensagem-erro';
    paragrafo.setAttribute('role', 'alert');
  }
  resultadoConsulta.replaceChildren(paragrafo);
}

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

function montarCardAtendimento(atendimento, paciente) {
  const card = document.createElement('article');
  card.className = 'card-atendimento';
  const titulo = document.createElement('h2');
  titulo.textContent = `Atendimento ${atendimento.numero_atendimento}`;

  const dados = document.createElement('div');
  dados.className = 'dados-atendimento';
  adicionarDado(dados, 'Paciente', paciente.nome);
  adicionarDado(dados, 'CPF', formatarCpf(paciente.cpf));
  adicionarDado(dados, 'Situação', atendimento.status_atendimento);
  adicionarDado(dados, 'Data e hora de chegada', formatarDataHora(atendimento.data_hora_chegada));

  card.append(titulo, dados);
  return card;
}

function montarHistorico(atendimentos) {
  const secao = document.createElement('section');
  secao.className = 'historico-paciente';
  const titulo = document.createElement('h2');
  titulo.textContent = 'Histórico de atendimentos';

  const tabela = document.createElement('table');
  tabela.innerHTML = '<thead><tr><th>Número</th><th>Chegada</th><th>Situação</th></tr></thead>';
  const corpo = document.createElement('tbody');
  for (const atendimento of atendimentos) {
    const linha = document.createElement('tr');
    for (const valor of [
      atendimento.numero_atendimento,
      formatarDataHora(atendimento.data_hora_chegada),
      atendimento.status_atendimento,
    ]) {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    }
    corpo.appendChild(linha);
  }
  tabela.appendChild(corpo);

  secao.append(titulo, tabela);
  return secao;
}

async function buscarJson(url) {
  const resposta = await fetch(url);
  if (resposta.status === 404) return null;
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.detail ?? 'Erro ao consultar atendimento.');
  }
  return resposta.json();
}

async function consultarPorNumero(numero) {
  const atendimento = await buscarJson(`/api/atendimentos/${numero}`);
  if (!atendimento) {
    mostrarMensagem(`Atendimento ${numero} não encontrado.`, true);
    return;
  }
  resultadoConsulta.replaceChildren(montarCardAtendimento(atendimento, atendimento));
}

async function consultarPorCpf(cpf) {
  const [paciente, atendimentos] = await Promise.all([
    buscarJson(`/api/pacientes/${cpf}`),
    buscarJson(`/api/atendimentos?cpf=${cpf}`),
  ]);

  if (!paciente) {
    mostrarMensagem('Paciente não encontrado para o CPF informado.', true);
    return;
  }
  if (!atendimentos || atendimentos.length === 0) {
    mostrarMensagem(`${paciente.nome} não possui atendimentos registrados.`);
    return;
  }

  const [maisRecente, ...anteriores] = atendimentos;
  const conteudo = [montarCardAtendimento(maisRecente, paciente)];
  if (anteriores.length > 0) conteudo.push(montarHistorico(anteriores));
  resultadoConsulta.replaceChildren(...conteudo);
}

formularioConsulta.addEventListener('submit', async (event) => {
  event.preventDefault();
  const valor = identificadorAtendimento.value.trim().toUpperCase();
  const numeros = valor.replace(/\D/g, '');

  let consulta;
  if (/^AT\d{4,9}$/.test(valor)) {
    consulta = () => consultarPorNumero(valor);
  } else if (numeros.length === 11 && !/^(\d)\1{10}$/.test(numeros)) {
    consulta = () => consultarPorCpf(numeros);
  } else {
    mostrarMensagem('Informe um número no formato AT0001 ou um CPF válido.', true);
    return;
  }

  mostrarMensagem('Consultando...');
  try {
    await consulta();
  } catch (erro) {
    mostrarMensagem(erro instanceof TypeError ? 'Não foi possível conectar à API.' : erro.message, true);
  }
});

const numeroInicial = new URLSearchParams(window.location.search).get('numero');
if (numeroInicial) {
  identificadorAtendimento.value = numeroInicial;
  formularioConsulta.requestSubmit();
}
