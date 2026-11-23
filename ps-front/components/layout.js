const API_URL = '/api';

function formatarCpf(cpf) {
  return cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não informado';
}

function formatarData(isoData) {
  if (!isoData) return 'Não informado';
  const [ano, mes, dia] = isoData.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function lerJson(resposta) {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
}

function criarControleDeBusca() {
  let buscaAtual = 0;
  return function iniciar() {
    const minhaBusca = ++buscaAtual;
    return () => minhaBusca === buscaAtual;
  };
}

function podeAbrirAtendimento(status) {
  return !status || status === 'Encerrado' || status === 'Cancelado';
}

function cpfComDigitosValidos(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base) => {
    const soma = [...base].reduce((total, d, i) => total + Number(d) * (base.length + 1 - i), 0);
    return (soma * 10) % 11 % 10;
  };
  return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10]);
}

function numeroAtendimentoValido(numero) {
  return /^AT[0-9]{4,9}$/i.test(numero ?? '');
}

function mostrarEstadoTabela(corpoTabela, quantidadeColunas, texto, erro = false) {
  const linha = document.createElement('tr');
  const celula = document.createElement('td');
  celula.colSpan = quantidadeColunas;
  celula.className = erro ? 'estado-lista mensagem-erro' : 'estado-lista';
  celula.setAttribute('role', erro ? 'alert' : 'status');
  celula.textContent = texto;
  linha.appendChild(celula);
  corpoTabela.replaceChildren(linha);
}

function montarLinhaListaPacientes(paciente, aoEscolherPaciente, criarAcaoDoPaciente) {
  const linha = document.createElement('tr');

  let nomePaciente = paciente.nome;
  if (paciente.cpf) {
    nomePaciente = document.createElement('a');
    nomePaciente.className = 'appointment-number';
    nomePaciente.href = `?cpf=${paciente.cpf}`;
    nomePaciente.textContent = paciente.nome;
    nomePaciente.addEventListener('click', (event) => {
      event.preventDefault();
      aoEscolherPaciente(paciente.cpf);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  for (const conteudo of [
    nomePaciente,
    formatarCpf(paciente.cpf),
    formatarData(paciente.data_nascimento),
    paciente.telefone ?? '—',
    paciente.genero ?? '—',
  ]) {
    const celula = document.createElement('td');
    celula.append(conteudo ?? '—');
    linha.appendChild(celula);
  }

  if (criarAcaoDoPaciente) {
    const celulaAcao = document.createElement('td');
    celulaAcao.className = 'table-actions';
    celulaAcao.appendChild(criarAcaoDoPaciente(paciente));
    linha.appendChild(celulaAcao);
  }
  return linha;
}

async function carregarListaPacientes(corpoTabela, aoEscolherPaciente, criarAcaoDoPaciente) {
  const QUANTIDADE_COLUNAS = criarAcaoDoPaciente ? 6 : 5;
  mostrarEstadoTabela(corpoTabela, QUANTIDADE_COLUNAS, 'Carregando pacientes...');
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/pacientes`);
  } catch {
    mostrarEstadoTabela(corpoTabela, QUANTIDADE_COLUNAS, 'Não foi possível conectar à API.', true);
    return;
  }
  const pacientes = await lerJson(resposta);
  if (!resposta.ok || !Array.isArray(pacientes)) {
    mostrarEstadoTabela(corpoTabela, QUANTIDADE_COLUNAS, pacientes?.detail ?? 'Erro ao carregar os pacientes.', true);
    return;
  }
  if (pacientes.length === 0) {
    mostrarEstadoTabela(corpoTabela, QUANTIDADE_COLUNAS, 'Nenhum paciente cadastrado.');
    return;
  }
  const pacientesPorNome = [...pacientes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  corpoTabela.replaceChildren(...pacientesPorNome.map((paciente) => montarLinhaListaPacientes(paciente, aoEscolherPaciente, criarAcaoDoPaciente)));
}

(() => {
  const fetchOriginal = window.fetch.bind(window);
  function voltarAoLoginSeSessaoExpirou(resposta) {
    if (resposta.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('perfilUsuario');
      sessionStorage.removeItem('nomeUsuario');
      window.location.href = './login.html';
    }
    return resposta;
  }

  window.fetch = (url, opcoes = {}) => {
    if (!String(url).startsWith(API_URL)) return fetchOriginal(url, opcoes);
    const token = sessionStorage.getItem('token');
    const opcoesComToken = token
      ? { ...opcoes, headers: { ...opcoes.headers, Authorization: `Bearer ${token}` } }
      : opcoes;
    return fetchOriginal(url, opcoesComToken).then(voltarAoLoginSeSessaoExpirou);
  };

  const paginas = {
    'index.html': 'painel',
    'h02-buscar-paciente.html': 'pacientes',
    'h03-cadastrar-paciente.html': 'pacientes',
    'h04-abrir-atendimento.html': 'atendimento',
    'h05-consultar-atendimento.html': 'historico',
    'h06-fila-triagem.html': 'triagem',
    'h11-alterar-atendimento.html': 'alterar-atendimento',
    'h12-atendimento-medico.html': 'atendimento-medico',
    'h14-alta-atendimento.html': 'alta',
    'administracao.html': 'admin',
    'h19-cadastrar-profissional.html': 'cadastro-profissional',
    'h20-completar-dados-paciente.html': 'pacientes',
  };

  const paginasPermitidas = {
    'Recepção': new Set(['painel', 'pacientes', 'atendimento', 'historico', 'alterar-atendimento', 'cadastro-profissional']),
    'Enfermagem': new Set(['painel', 'historico', 'triagem']),
    'Médico': new Set(['painel', 'historico', 'alta', 'atendimento-medico']),
  };

  const perfilUsuario = sessionStorage.getItem('perfilUsuario');
  const tokenUsuario = sessionStorage.getItem('token');

  if (!perfilUsuario || !tokenUsuario) {
    window.location.replace('./login.html');
    return;
  }

  async function carregarComponente(seletor, arquivo) {
    const destino = document.querySelector(seletor);
    if (!destino) {
      throw new Error(`Não foi encontrado o destino do componente "${seletor}".`);
    }

    const resposta = await fetch(`./components/${arquivo}`);
    if (!resposta.ok) {
      throw new Error(`Falha ao carregar "${arquivo}": ${resposta.status} ${resposta.statusText}`);
    }

    destino.outerHTML = await resposta.text();
  }

  async function buscarNomeUsuarioSeFaltar() {
    if (sessionStorage.getItem('nomeUsuario') || !sessionStorage.getItem('token')) return;
    const resposta = await fetch(`${API_URL}/auth/eu`);
    const profissional = resposta.ok ? await lerJson(resposta) : null;
    if (profissional?.nome) sessionStorage.setItem('nomeUsuario', profissional.nome);
  }

  function mostrarUsuarioLogado() {
    const nome = sessionStorage.getItem('nomeUsuario') || 'Usuário';
    document.getElementById('nome-usuario').textContent = nome;
    document.getElementById('perfil-usuario').textContent = sessionStorage.getItem('perfilUsuario') ?? '';
    document.getElementById('avatar-usuario').textContent = nome.charAt(0).toUpperCase();
  }

  Promise.all([
    carregarComponente('[data-componente="cabecalho"]', 'cabecalho.html'),
    carregarComponente('[data-componente="menu-lateral"]', 'menu-lateral.html'),
  ])
    .then(() => {
      mostrarUsuarioLogado();
      buscarNomeUsuarioSeFaltar().then(mostrarUsuarioLogado).catch(() => {});
      const arquivoAtual = window.location.pathname.split('/').pop() || 'index.html';
      const paginaAtual = paginas[arquivoAtual];
      const paginasDoPerfil = paginasPermitidas[perfilUsuario] ?? new Set();

      if (!paginaAtual || !paginasDoPerfil.has(paginaAtual)) {
        window.location.replace('./index.html');
        return;
      }

      document.querySelectorAll('.menu-item[data-pagina]').forEach((item) => {
        if (!paginasDoPerfil.has(item.dataset.pagina)) item.remove();
      });

      if (perfilUsuario !== 'Recepção') {
        document.querySelectorAll('.primary-button').forEach((botao) => botao.remove());
      }

      const itemAtual = document.querySelector(`.menu-item[data-pagina="${paginaAtual}"]`);

      if (itemAtual) {
        itemAtual.classList.add('active');
        itemAtual.setAttribute('aria-current', 'page');
      }
    })
    .catch((erro) => {
      console.error('Não foi possível montar a navegação compartilhada.', erro);
    });
})();
