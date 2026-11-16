const formularioConsulta = document.getElementById('form-consulta-atendimento');
const identificadorAtendimento = document.getElementById('identificador-atendimento');
const resultadoConsulta = document.getElementById('resultado-consulta');
const novaConsulta = criarControleDeBusca();

class ErroConsulta extends Error {}

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
  conteudo.textContent = valor || '—';
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
  adicionarDado(dados, 'Paciente', paciente.nome || 'Nome não disponível');
  adicionarDado(dados, 'CPF', formatarCpf(paciente.cpf));
  adicionarDado(dados, 'Situação', atendimento.status_atendimento);
  adicionarDado(dados, 'Data e hora de chegada', formatarDataHora(atendimento.data_hora_chegada));

  const acoes = document.createElement('div');
  acoes.className = 'acoes-atendimento';
  const alterar = document.createElement('a');
  alterar.className = 'botao-alterar-atendimento';
  alterar.href = `./h11-alterar-atendimento.html?numero=${encodeURIComponent(atendimento.numero_atendimento)}`;
  alterar.textContent = 'Alterar atendimento';
  alterar.setAttribute('aria-label', `Alterar atendimento ${atendimento.numero_atendimento}`);
  acoes.appendChild(alterar);

  card.append(titulo, dados, acoes);
  return card;
}

function montarHistorico(atendimentos) {
  const secao = document.createElement('section');
  secao.className = 'historico-paciente';
  const titulo = document.createElement('h2');
  titulo.textContent = 'Histórico de atendimentos';

  const tabela = document.createElement('table');
  tabela.innerHTML = '<thead><tr><th>Número</th><th>Chegada</th><th>Situação</th><th>Ação</th></tr></thead>';
  const corpo = document.createElement('tbody');
  for (const atendimento of atendimentos) {
    const linha = document.createElement('tr');
    for (const valor of [
      atendimento.numero_atendimento,
      formatarDataHora(atendimento.data_hora_chegada),
      atendimento.status_atendimento,
    ]) {
      const celula = document.createElement('td');
      celula.textContent = valor || '—';
      linha.appendChild(celula);
    }

    const acao = document.createElement('td');
    const alterar = document.createElement('a');
    alterar.href = `./h11-alterar-atendimento.html?numero=${encodeURIComponent(atendimento.numero_atendimento)}`;
    alterar.textContent = 'Alterar';
    alterar.setAttribute('aria-label', `Alterar atendimento ${atendimento.numero_atendimento}`);
    acao.appendChild(alterar);
    linha.appendChild(acao);
    corpo.appendChild(linha);
  }
  tabela.appendChild(corpo);

  secao.append(titulo, tabela);
  return secao;
}

async function buscarJson(url) {
  let resposta;
  try {
    resposta = await fetch(url);
  } catch {
    throw new ErroConsulta('Não foi possível conectar à API.');
  }
  if (resposta.status === 404) return null;

  const corpo = await lerJson(resposta);
  if (!resposta.ok) throw new ErroConsulta(corpo?.detail ?? 'Erro ao consultar atendimento.');
  if (corpo === null) throw new ErroConsulta('A API respondeu em um formato inesperado.');
  return corpo;
}

async function consultarPorNumero(numero, aindaValida) {
  const atendimento = await buscarJson(`${API_URL}/atendimentos/${encodeURIComponent(numero)}`);
  if (!aindaValida()) return;
  if (!atendimento) {
    mostrarMensagem(`Atendimento ${numero} não encontrado.`, true);
    return;
  }
  resultadoConsulta.replaceChildren(montarCardAtendimento(atendimento, atendimento));
}

async function consultarPorCpf(cpf, aindaValida) {
  const atendimentos = await buscarJson(`${API_URL}/atendimentos?cpf=${encodeURIComponent(cpf)}`);
  if (!aindaValida()) return;

  if (atendimentos && atendimentos.length > 0) {
    const [maisRecente, ...anteriores] = atendimentos;
    const conteudo = [montarCardAtendimento(maisRecente, maisRecente)];
    if (anteriores.length > 0) conteudo.push(montarHistorico(anteriores));
    resultadoConsulta.replaceChildren(...conteudo);
    return;
  }

  const paciente = await buscarJson(`${API_URL}/pacientes/${encodeURIComponent(cpf)}`);
  if (!aindaValida()) return;
  if (!paciente) {
    mostrarMensagem('Paciente não encontrado para o CPF informado.', true);
    return;
  }
  mostrarMensagem(`${paciente.nome} não possui atendimentos registrados.`);
}

formularioConsulta.addEventListener('submit', async (event) => {
  event.preventDefault();
  const valor = identificadorAtendimento.value.trim().toUpperCase();
  const numeros = valor.replace(/\D/g, '');

  const aindaValida = novaConsulta();
  let consulta;
  if (/^AT\d{4,9}$/.test(valor)) {
    consulta = () => consultarPorNumero(valor, aindaValida);
  } else if (numeros.length === 11 && !/^(\d)\1{10}$/.test(numeros)) {
    consulta = () => consultarPorCpf(numeros, aindaValida);
  } else {
    mostrarMensagem('Informe um número no formato AT0001 ou um CPF válido.', true);
    return;
  }

  mostrarMensagem('Consultando...');
  try {
    await consulta();
  } catch (erro) {
    if (!aindaValida()) return;
    if (erro instanceof ErroConsulta) {
      mostrarMensagem(erro.message, true);
    } else {
      console.error(erro);
      mostrarMensagem('Erro inesperado ao exibir a consulta. Tente novamente.', true);
    }
  }
});

const parametros = new URLSearchParams(window.location.search);
const identificadorInicial = parametros.get('numero') ?? parametros.get('cpf');
if (identificadorInicial) {
  identificadorAtendimento.value = identificadorInicial;
  formularioConsulta.requestSubmit();
}
