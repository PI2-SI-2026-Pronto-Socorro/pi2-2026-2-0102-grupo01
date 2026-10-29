const CHAVE_TEMA = 'tema';

function temaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === 'light' || salvo === 'dark') return salvo;
  } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.documentElement.setAttribute('data-bs-theme', temaInicial());

document.addEventListener('click', (evento) => {
  if (!evento.target.closest('[data-alternar-tema]')) return;

  const novoTema = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', novoTema);
  try {
    localStorage.setItem(CHAVE_TEMA, novoTema);
  } catch {}
});
