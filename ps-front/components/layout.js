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
    'h11-alterar-atendimento.html': 'historico',
    'h12-atendimento-medico.html': 'painel',
    'h14-alta-atendimento.html': 'alta',
    'administracao.html': 'admin',
    'h19-cadastrar-profissional.html': 'cadastro-profissional',
    'h20-completar-dados-paciente.html': 'pacientes',
  };

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

  function aplicarMenuPorPerfil() {
    const perfil = sessionStorage.getItem('perfilUsuario');
    if (!perfil) return;
    document.querySelectorAll('.menu-item[data-perfis]').forEach((item) => {
      item.hidden = !item.dataset.perfis.split(',').includes(perfil);
    });
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
      aplicarMenuPorPerfil();
      mostrarUsuarioLogado();
      buscarNomeUsuarioSeFaltar().then(mostrarUsuarioLogado).catch(() => {});
      const arquivoAtual = window.location.pathname.split('/').pop() || 'index.html';
      const paginaAtual = paginas[arquivoAtual];
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
