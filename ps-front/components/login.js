const formularioLogin = document.getElementById('formulario-login');

formularioLogin.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!formularioLogin.reportValidity()) return;

  window.location.href = './index.html';
});
