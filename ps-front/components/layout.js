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
