// Utilidades compartilhadas por todas as páginas (o layout.js é carregado antes dos outros scripts).
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

// Lê o corpo JSON da resposta; devolve null se vier vazio ou inválido, sem lançar erro.
async function lerJson(resposta) {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
}

// Controla buscas concorrentes: cada chamada de iniciar() invalida as anteriores,
// e o retorno diz se aquela busca ainda é a mais recente.
function criarControleDeBusca() {
  let buscaAtual = 0;
  return function iniciar() {
    const minhaBusca = ++buscaAtual;
    return () => minhaBusca === buscaAtual;
  };
}

// Um paciente só pode abrir atendimento novo se não tiver nenhum em andamento.
function podeAbrirAtendimento(status) {
  return !status || status === 'Encerrado' || status === 'Cancelado';
}

(() => {
  const paginas = {
    'index.html': 'painel',
    'h02-buscar-paciente.html': 'pacientes',
    'h03-cadastrar-paciente.html': 'pacientes',
    'h04-abrir-atendimento.html': 'atendimento',
    'h05-consultar-atendimento.html': 'historico',
    'h06-fila-triagem.html': 'triagem',
    'administracao.html': 'admin',
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

  Promise.all([
    carregarComponente('[data-componente="cabecalho"]', 'cabecalho.html'),
    carregarComponente('[data-componente="menu-lateral"]', 'menu-lateral.html'),
  ])
    .then(() => {
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
