const identificacaoAtendimento = document.getElementById('identificacao-atendimento');
const mensagemCarregamento = document.getElementById('mensagem-carregamento');
const mensagemAtendimento = document.getElementById('mensagem-atendimento');
const mensagemMedicacao = document.getElementById('mensagem-medicacao');
const dadosTriagem = document.getElementById('dados-triagem');
const listaQueixas = document.getElementById('lista-queixas');
const listaMedicacoes = document.getElementById('lista-medicacoes');
const estadoMedicacoes = document.getElementById('estado-medicacoes');
const formularioMedicacoes = document.getElementById('form-medicacoes');
const camposMedicacoes = document.getElementById('campos-medicacoes');
const profissionalResponsavel = document.getElementById('profissional-responsavel');
const medicamentosARegistrar = document.getElementById('medicamentos-a-registrar');
const botaoAdicionarMedicamento = document.getElementById('adicionar-medicamento');
const botaoSalvarMedicacoes = document.getElementById('salvar-medicacoes');
const botaoConfirmarAtendimento = document.getElementById('confirmar-atendimento');
const botaoTentarProfissionaisNovamente = document.getElementById('tentar-profissionais-novamente');
const avisoConfirmacao = document.getElementById('aviso-confirmacao');
const orientacoesRegistradas = document.getElementById('orientacoes-registradas');
const numeroAtendimento = new URLSearchParams(window.location.search).get('numero');

let atendimentoAtual = null;
let detalhesAtuais = null;
let profissionaisCarregados = false;
let existeMedicoCadastrado = false;
let proximoIdMedicamento = 0;

function mostrarMensagem(elemento, texto, tipo = '') {
  elemento.textContent = texto;
  elemento.className = `mensagem-h12 ${tipo}`.trim();
  elemento.hidden = !texto;
  if (tipo === 'mensagem-erro') elemento.setAttribute('role', 'alert');
  else elemento.setAttribute('role', 'status');
}

function adicionarDadoTriagem(titulo, valor) {
  const item = document.createElement('div');
  item.className = 'dado-triagem';
  const rotulo = document.createElement('span');
  rotulo.textContent = titulo;
  const conteudo = document.createElement('strong');
  conteudo.textContent = valor ?? '—';
  item.append(rotulo, conteudo);
  dadosTriagem.appendChild(item);
}

function descreverMedicamento(medicacao) {
  return [medicacao.medicamento, medicacao.apresentacao, medicacao.concentracao]
    .filter(Boolean)
    .join(' ');
}

function atualizarEstadoDosBotoes(atendimentoTriado, temMedicacoes) {
  camposMedicacoes.disabled =
    !atendimentoTriado ||
    !profissionaisCarregados ||
    !existeMedicoCadastrado;
  botaoSalvarMedicacoes.disabled = camposMedicacoes.disabled;
  botaoAdicionarMedicamento.disabled = camposMedicacoes.disabled;
  botaoConfirmarAtendimento.disabled = !atendimentoTriado || !temMedicacoes;
}

function montarLinhaMedicacao(medicacao) {
  const linha = document.createElement('tr');
  const valores = [
    descreverMedicamento(medicacao),
    `${medicacao.dose || '—'} · a cada ${medicacao.intervalo_horas || '—'} h`,
    medicacao.duracao_dias ? `${medicacao.duracao_dias} dia(s)` : '—',
    medicacao.via || '—',
    medicacao.observacao || '—',
    formatarDataHora(medicacao.data_hora_prescricao),
  ];
  for (const valor of valores) {
    const celula = document.createElement('td');
    celula.textContent = valor;
    linha.appendChild(celula);
  }
  return linha;
}

function renderizarDetalhes(detalhes) {
  const { atendimento, paciente, sinais_vitais: sinaisVitais, queixas, medicacoes } = detalhes;
  detalhesAtuais = detalhes;
  atendimentoAtual = atendimento;
  identificacaoAtendimento.textContent =
    `${atendimento.numero_atendimento} · ${paciente.nome || 'Paciente sem nome'}`;
  dadosTriagem.replaceChildren();

  adicionarDadoTriagem('Paciente', paciente.nome || 'Nome não disponível');
  adicionarDadoTriagem('CPF', formatarCpf(paciente.cpf));
  adicionarDadoTriagem('Nascimento', formatarData(paciente.data_nascimento));
  adicionarDadoTriagem('Situação', atendimento.status_atendimento);
  adicionarDadoTriagem('Chegada', formatarDataHora(atendimento.data_hora_chegada));

  if (sinaisVitais) {
    adicionarDadoTriagem('Classificação de risco', sinaisVitais.classificacao_risco);
    adicionarDadoTriagem(
      'Pressão arterial',
      `${sinaisVitais.pressao_sistolica ?? '—'} / ${sinaisVitais.pressao_diastolica ?? '—'} mmHg`,
    );
    adicionarDadoTriagem(
      'Temperatura',
      sinaisVitais.temperatura == null ? '—' : `${sinaisVitais.temperatura} °C`,
    );
    adicionarDadoTriagem('Frequência cardíaca', `${sinaisVitais.frequencia_cardiaca ?? '—'} bpm`);
    adicionarDadoTriagem('Triagem realizada em', formatarDataHora(sinaisVitais.data_hora_triagem));
  } else {
    adicionarDadoTriagem('Dados vitais', 'Triagem ainda não registrada');
  }

  const itensQueixa = (queixas ?? []).map((queixa) => {
    const item = document.createElement('li');
    item.textContent = queixa.duracao_sintoma
      ? `${queixa.sintomas} · ${queixa.duracao_sintoma}`
      : queixa.sintomas;
    return item;
  });
  if (itensQueixa.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma queixa registrada.';
    itensQueixa.push(item);
  }
  listaQueixas.replaceChildren(...itensQueixa);

  const itensMedicacao = medicacoes ?? [];
  estadoMedicacoes.textContent = itensMedicacao.length
    ? `${itensMedicacao.length} medicação(ões) registrada(s).`
    : 'Nenhuma medicação registrada. Registre uma antes de confirmar o atendimento.';
  if (itensMedicacao.length) {
    listaMedicacoes.replaceChildren(...itensMedicacao.map(montarLinhaMedicacao));
  } else {
    const linha = document.createElement('tr');
    const celula = document.createElement('td');
    celula.colSpan = 6;
    celula.textContent = 'Nenhuma medicação registrada.';
    linha.appendChild(celula);
    listaMedicacoes.replaceChildren(linha);
  }

  const orientacoes =
    itensMedicacao.find((medicacao) => medicacao.orientacoes)?.orientacoes ??
    detalhes.orientacoes ??
    atendimento.orientacoes;
  if (orientacoes) {
    orientacoesRegistradas.textContent = `Orientações: ${orientacoes}`;
    orientacoesRegistradas.hidden = false;
  } else {
    orientacoesRegistradas.textContent = '';
    orientacoesRegistradas.hidden = true;
  }

  const atendimentoTriado = atendimento.status_atendimento === 'Triado';
  const temMedicacoes = itensMedicacao.length > 0;
  avisoConfirmacao.hidden = !atendimentoTriado || temMedicacoes;
  atualizarEstadoDosBotoes(atendimentoTriado, temMedicacoes);
  if (!atendimentoTriado) {
    mostrarMensagem(
      mensagemAtendimento,
      `O atendimento está ${atendimento.status_atendimento} e não pode receber medicações ou confirmação.`,
      'mensagem-aviso',
    );
  } else {
    mensagemAtendimento.hidden = true;
  }
}

async function carregarDetalhes() {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/atendimentos/${encodeURIComponent(numeroAtendimento)}/detalhes`);
  } catch {
    mostrarMensagem(mensagemCarregamento, 'Não foi possível conectar à API.', 'mensagem-erro');
    return false;
  }

  const detalhes = await lerJson(resposta);
  if (!resposta.ok || !detalhes?.atendimento || !detalhes?.paciente) {
    mostrarMensagem(
      mensagemCarregamento,
      detalhes?.detail ?? 'Não foi possível carregar os dados do atendimento.',
      'mensagem-erro',
    );
    return false;
  }

  mensagemCarregamento.hidden = true;
  renderizarDetalhes(detalhes);
  return true;
}

function criarCampoMedicacao(rotulo, chave, opcoes = {}) {
  const campo = document.createElement('div');
  campo.className = 'campo-medico';
  const id = `medicacao-${proximoIdMedicamento}-${chave}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = rotulo;

  const input = document.createElement('input');
  input.id = id;
  input.dataset.campo = chave;
  input.type = opcoes.type ?? 'text';
  if (opcoes.required) input.required = true;
  if (opcoes.maxLength) input.maxLength = opcoes.maxLength;
  if (opcoes.min != null) input.min = String(opcoes.min);
  if (opcoes.max != null) input.max = String(opcoes.max);
  if (opcoes.step) input.step = String(opcoes.step);
  if (opcoes.placeholder) input.placeholder = opcoes.placeholder;
  campo.append(label, input);
  return campo;
}

function atualizarBotoesRemover() {
  const linhas = [...medicamentosARegistrar.querySelectorAll('.medicamento-formulario')];
  linhas.forEach((linha, indice) => {
    linha.querySelector('.remover-medicamento').disabled = linhas.length === 1;
    linha.querySelector('legend').textContent = `Medicamento ${indice + 1}`;
  });
}

function adicionarMedicamento() {
  proximoIdMedicamento += 1;
  const linha = document.createElement('fieldset');
  linha.className = 'medicamento-formulario';
  const legenda = document.createElement('legend');
  legenda.textContent = `Medicamento ${proximoIdMedicamento}`;
  linha.appendChild(legenda);

  const campos = document.createElement('div');
  campos.className = 'grade-medicamento';
  campos.append(
    criarCampoMedicacao('Medicamento', 'medicamento', { required: true, maxLength: 100 }),
    criarCampoMedicacao('Apresentação', 'apresentacao', { maxLength: 50 }),
    criarCampoMedicacao('Concentração', 'concentracao', { maxLength: 50 }),
    criarCampoMedicacao('Dose', 'dose', { required: true, maxLength: 50 }),
    criarCampoMedicacao('Intervalo (horas)', 'intervalo_horas', {
      type: 'number', required: true, min: 1, max: 168, step: 1,
    }),
    criarCampoMedicacao('Duração (dias)', 'duracao_dias', {
      type: 'number', min: 1, max: 365, step: 1,
    }),
    criarCampoMedicacao('Via', 'via', { maxLength: 30, placeholder: 'Ex.: oral' }),
    criarCampoMedicacao('Observação', 'observacao', { maxLength: 255 }),
  );
  linha.appendChild(campos);

  const remover = document.createElement('button');
  remover.className = 'botao-secundario remover-medicamento';
  remover.type = 'button';
  remover.textContent = 'Remover medicamento';
  remover.addEventListener('click', () => {
    linha.remove();
    atualizarBotoesRemover();
  });
  linha.appendChild(remover);
  medicamentosARegistrar.appendChild(linha);
  atualizarBotoesRemover();
}

function coletarMedicacoes() {
  return [...medicamentosARegistrar.querySelectorAll('.medicamento-formulario')].map((linha) => {
    const obter = (chave) => linha.querySelector(`[data-campo="${chave}"]`).value.trim();
    const duracao = obter('duracao_dias');
    return {
      medicamento: obter('medicamento'),
      apresentacao: obter('apresentacao'),
      concentracao: obter('concentracao'),
      dose: obter('dose'),
      intervalo_horas: Number(obter('intervalo_horas')),
      duracao_dias: duracao ? Number(duracao) : null,
      via: obter('via'),
      observacao: obter('observacao'),
    };
  });
}

async function carregarProfissionais() {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/profissionais`);
  } catch {
    profissionaisCarregados = false;
    existeMedicoCadastrado = false;
    mostrarMensagem(mensagemMedicacao, 'Não foi possível carregar os profissionais pela API.', 'mensagem-erro');
    botaoTentarProfissionaisNovamente.hidden = false;
    if (detalhesAtuais) atualizarEstadoDosBotoes(detalhesAtuais.atendimento.status_atendimento === 'Triado', (detalhesAtuais.medicacoes ?? []).length > 0);
    return;
  }

  const profissionais = await lerJson(resposta);
  if (!resposta.ok || !Array.isArray(profissionais)) {
    profissionaisCarregados = false;
    existeMedicoCadastrado = false;
    mostrarMensagem(
      mensagemMedicacao,
      profissionais?.detail ?? 'Não foi possível carregar os profissionais.',
      'mensagem-erro',
    );
    botaoTentarProfissionaisNovamente.hidden = false;
    if (detalhesAtuais) atualizarEstadoDosBotoes(detalhesAtuais.atendimento.status_atendimento === 'Triado', (detalhesAtuais.medicacoes ?? []).length > 0);
    return;
  }

  const medicos = profissionais.filter((profissional) => profissional.perfil === 'Médico');
  const opcaoInicial = new Option(medicos.length ? 'Selecione' : 'Nenhum médico cadastrado', '');
  const opcoes = medicos.map(
    (profissional) => new Option(profissional.nome, profissional.id_profissional),
  );
  const profissionalSelecionado = profissionalResponsavel.value;
  profissionalResponsavel.replaceChildren(opcaoInicial, ...opcoes);
  if (medicos.some((profissional) => profissional.id_profissional === profissionalSelecionado)) {
    profissionalResponsavel.value = profissionalSelecionado;
  }
  profissionaisCarregados = true;
  existeMedicoCadastrado = medicos.length > 0;
  botaoTentarProfissionaisNovamente.hidden = true;
  if (detalhesAtuais) renderizarDetalhes(detalhesAtuais);
  if (medicos.length === 0) {
    mostrarMensagem(mensagemMedicacao, 'Não há profissional médico cadastrado para registrar medicações.', 'mensagem-erro');
  }
}

async function salvarMedicacoes(event) {
  event.preventDefault();
  mensagemMedicacao.hidden = true;
  if (!formularioMedicacoes.reportValidity()) return;

  botaoSalvarMedicacoes.disabled = true;
  const corpo = {
    id_profissional: profissionalResponsavel.value,
    medicacoes: coletarMedicacoes(),
  };
  const orientacoes = document.getElementById('orientacoes').value.trim();
  if (orientacoes) corpo.orientacoes = orientacoes;

  let resposta;
  try {
    resposta = await fetch(
      `${API_URL}/atendimentos/${encodeURIComponent(numeroAtendimento)}/medicacoes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      },
    );
  } catch {
    mostrarMensagem(mensagemMedicacao, 'Não foi possível conectar à API para registrar as medicações.', 'mensagem-erro');
    botaoSalvarMedicacoes.disabled = false;
    return;
  }

  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    mostrarMensagem(
      mensagemMedicacao,
      resultado?.detail ?? 'Não foi possível registrar as medicações.',
      'mensagem-erro',
    );
    botaoSalvarMedicacoes.disabled = false;
    return;
  }

  const profissionalSelecionado = profissionalResponsavel.value;
  formularioMedicacoes.reset();
  profissionalResponsavel.value = profissionalSelecionado;
  medicamentosARegistrar.replaceChildren();
  adicionarMedicamento();
  mostrarMensagem(mensagemMedicacao, 'Medicações registradas com sucesso.', 'mensagem-sucesso');
  const detalhesCarregados = await carregarDetalhes();
  if (!detalhesCarregados) {
    mostrarMensagem(
      mensagemMedicacao,
      'Medicações registradas, mas não foi possível atualizar os dados exibidos. Tente recarregar a tela.',
      'mensagem-aviso',
    );
  }
  botaoSalvarMedicacoes.disabled = camposMedicacoes.disabled;
}

async function confirmarAtendimento() {
  mensagemAtendimento.hidden = true;
  botaoConfirmarAtendimento.disabled = true;
  let resposta;
  try {
    resposta = await fetch(
      `${API_URL}/atendimentos/${encodeURIComponent(numeroAtendimento)}/confirmacao`,
      { method: 'POST' },
    );
  } catch {
    mostrarMensagem(mensagemAtendimento, 'Não foi possível conectar à API para confirmar o atendimento.', 'mensagem-erro');
    botaoConfirmarAtendimento.disabled = false;
    return;
  }

  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    mostrarMensagem(
      mensagemAtendimento,
      resultado?.detail ?? 'Não foi possível confirmar o atendimento.',
      'mensagem-erro',
    );
    await carregarDetalhes();
    return;
  }

  if (detalhesAtuais) {
    detalhesAtuais.atendimento.status_atendimento = resultado.status_atendimento ?? 'Confirmado';
    renderizarDetalhes(detalhesAtuais);
  }
  mostrarMensagem(mensagemAtendimento, 'Atendimento confirmado com sucesso.', 'mensagem-sucesso');
  botaoConfirmarAtendimento.disabled = true;
}

document.getElementById('adicionar-medicamento').addEventListener('click', adicionarMedicamento);
formularioMedicacoes.addEventListener('submit', salvarMedicacoes);
botaoConfirmarAtendimento.addEventListener('click', confirmarAtendimento);
botaoTentarProfissionaisNovamente.addEventListener('click', carregarProfissionais);

if (!numeroAtendimentoValido(numeroAtendimento)) {
  identificacaoAtendimento.textContent = 'Número de atendimento ausente ou inválido.';
  mostrarMensagem(mensagemCarregamento, 'Volte ao painel e selecione um atendimento válido.', 'mensagem-erro');
  camposMedicacoes.disabled = true;
  botaoConfirmarAtendimento.disabled = true;
} else {
  adicionarMedicamento();
  carregarDetalhes();
  carregarProfissionais();
}
