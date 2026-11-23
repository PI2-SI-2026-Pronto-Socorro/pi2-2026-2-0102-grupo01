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
  adicionarDado(dados, 'Motivo', atendimento.motivo_atendimento || 'Não informado');

    card.append(titulo, dados);
     const botaoCancelar = document.createElement('button');
  botaoCancelar.type = 'button';
  botaoCancelar.className = 'botao-principal';
  botaoCancelar.textContent = 'Cancelar consulta';

  botaoCancelar.addEventListener('click', async () => {
    if (!window.confirm('Deseja realmente cancelar esta consulta?')) return;

    botaoCancelar.disabled = true;
    let resposta;
    try {
      resposta = await fetch(
        `${API_URL}/atendimentos/${encodeURIComponent(atendimento.numero_atendimento)}/cancelar`,
        { method: 'PATCH' },
      );
    } catch {
      mostrarMensagem('Não foi possível conectar à API para cancelar a consulta.', true);
      botaoCancelar.disabled = false;
      return;
    }

    const resultado = await lerJson(resposta);
    if (!resposta.ok) {
      mostrarMensagem(resultado?.detail ?? 'Não foi possível cancelar a consulta.', true);
      botaoCancelar.disabled = false;
      return;
    }

    window.location.reload();
  });

if (atendimento.status_atendimento === 'Aberto') {
  card.appendChild(botaoCancelar);
}
    if (!['Confirmado', 'Encerrado', 'Cancelado'].includes(atendimento.status_atendimento)) {
      const acaoAlterar = document.createElement('a');
      acaoAlterar.className = 'botao-principal';
      acaoAlterar.href =
        `./h11-alterar-atendimento.html?numero=${encodeURIComponent(atendimento.numero_atendimento)}`;
      acaoAlterar.textContent = 'Alterar atendimento';
      card.appendChild(acaoAlterar);
    }
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

function descreverMedicamento(medicacaoRegistrada) {
  return [medicacaoRegistrada.medicamento, medicacaoRegistrada.apresentacao, medicacaoRegistrada.concentracao]
    .filter(Boolean)
    .join(' ');
}

function descreverPosologia(medicacaoRegistrada) {
  const partesPosologia = [`${medicacaoRegistrada.dose}, de ${medicacaoRegistrada.intervalo_horas} em ${medicacaoRegistrada.intervalo_horas} horas`];
  if (medicacaoRegistrada.duracao_dias) partesPosologia.push(`por ${medicacaoRegistrada.duracao_dias} dia(s)`);
  if (medicacaoRegistrada.via) partesPosologia.push(`via ${medicacaoRegistrada.via}`);
  return partesPosologia.join(', ');
}

function montarSecaoTriagem(detalhesAtendimento) {
  const secaoTriagem = document.createElement('section');
  secaoTriagem.className = 'historico-paciente';
  const titulo = document.createElement('h2');
  titulo.textContent = 'Dados da triagem';
  secaoTriagem.appendChild(titulo);

  const sinaisVitais = detalhesAtendimento.sinais_vitais;
  if (!sinaisVitais) {
    const avisoSemTriagem = document.createElement('p');
    avisoSemTriagem.textContent = 'Nenhuma triagem registrada neste atendimento.';
    secaoTriagem.appendChild(avisoSemTriagem);
    return secaoTriagem;
  }

  const dadosTriagem = document.createElement('div');
  dadosTriagem.className = 'dados-atendimento';
  adicionarDado(dadosTriagem, 'Classificação de risco', sinaisVitais.classificacao_risco);
  adicionarDado(dadosTriagem, 'Pressão arterial',
    `${sinaisVitais.pressao_sistolica ?? '—'} / ${sinaisVitais.pressao_diastolica ?? '—'} mmHg`);
  adicionarDado(dadosTriagem, 'Temperatura',
    sinaisVitais.temperatura == null ? '—' : `${sinaisVitais.temperatura} °C`);
  adicionarDado(dadosTriagem, 'Frequência cardíaca',
    `${sinaisVitais.frequencia_cardiaca ?? '—'} bpm`);
  adicionarDado(dadosTriagem, 'Triagem realizada em', formatarDataHora(sinaisVitais.data_hora_triagem));
  secaoTriagem.appendChild(dadosTriagem);

  const tituloQueixas = document.createElement('h3');
  tituloQueixas.textContent = 'Queixas relatadas';
  secaoTriagem.appendChild(tituloQueixas);

  const listaQueixas = document.createElement('ul');
  const queixas = detalhesAtendimento.queixas ?? [];
  if (queixas.length === 0) {
    const itemSemQueixa = document.createElement('li');
    itemSemQueixa.textContent = 'Nenhuma queixa registrada.';
    listaQueixas.appendChild(itemSemQueixa);
  } else {
    for (const queixa of queixas) {
      const itemQueixa = document.createElement('li');
      itemQueixa.textContent = queixa.duracao_sintoma
        ? `${queixa.sintomas} · ${queixa.duracao_sintoma}`
        : queixa.sintomas;
      listaQueixas.appendChild(itemQueixa);
    }
  }
  secaoTriagem.appendChild(listaQueixas);
  return secaoTriagem;
}

function montarSecaoMedicacoes(listaMedicacoes) {
  const secaoMedicacoes = document.createElement('section');
  secaoMedicacoes.className = 'historico-paciente';
  const tituloSecao = document.createElement('h2');
  tituloSecao.textContent = 'Medicações registradas';
  secaoMedicacoes.appendChild(tituloSecao);

  if (listaMedicacoes.length === 0) {
    const avisoSemMedicacao = document.createElement('p');
    avisoSemMedicacao.textContent = 'Nenhuma medicação registrada neste atendimento.';
    secaoMedicacoes.appendChild(avisoSemMedicacao);
    return secaoMedicacoes;
  }

  const tabelaMedicacoes = document.createElement('table');
  tabelaMedicacoes.innerHTML = '<thead><tr><th>Medicamento</th><th>Posologia</th><th>Observação</th><th>Registrada em</th></tr></thead>';
  const corpoTabela = document.createElement('tbody');
  for (const medicacaoRegistrada of listaMedicacoes) {
    const linhaMedicacao = document.createElement('tr');
    for (const valorCelula of [
      descreverMedicamento(medicacaoRegistrada),
      descreverPosologia(medicacaoRegistrada),
      medicacaoRegistrada.observacao ?? '-',
      formatarDataHora(medicacaoRegistrada.data_hora_prescricao),
    ]) {
      const celula = document.createElement('td');
      celula.textContent = valorCelula;
      linhaMedicacao.appendChild(celula);
    }
    corpoTabela.appendChild(linhaMedicacao);
  }
  tabelaMedicacoes.appendChild(corpoTabela);
  secaoMedicacoes.appendChild(tabelaMedicacoes);
  return secaoMedicacoes;
}

async function consultarPorNumero(numero, aindaValida) {
  const detalhesAtendimento = await buscarJson(`${API_URL}/atendimentos/${numero}/detalhes`);
  if (!aindaValida()) return;
  if (!detalhesAtendimento) {
    mostrarMensagem(`Atendimento ${numero} não encontrado.`, true);
    return;
  }
  resultadoConsulta.replaceChildren(
    montarCardAtendimento(detalhesAtendimento.atendimento, detalhesAtendimento.paciente),
    montarSecaoTriagem(detalhesAtendimento),
    montarSecaoMedicacoes(detalhesAtendimento.medicacoes ?? []),
  );
}

async function consultarPorCpf(cpf, aindaValida) {
  const atendimentos = await buscarJson(`${API_URL}/atendimentos?cpf=${cpf}`);
  if (!aindaValida()) return;

  if (atendimentos && atendimentos.length > 0) {
    const [maisRecente, ...anteriores] = atendimentos;
    const conteudo = [montarCardAtendimento(maisRecente, maisRecente)];
    if (anteriores.length > 0) conteudo.push(montarHistorico(anteriores));
    resultadoConsulta.replaceChildren(...conteudo);
    return;
  }

  const paciente = await buscarJson(`${API_URL}/pacientes/${cpf}`);
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
