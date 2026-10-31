const areaTriagem = document.getElementById('formulario-triagem');
const formTriagem = document.getElementById('form-registrar-triagem');
const mensagemTriagem = document.getElementById('mensagem-triagem');
const botaoCancelarTriagem = document.getElementById('cancelar-triagem');

function abrirFormularioTriagem() {
  document.getElementById('paciente-triagem').textContent = 'Os dados do paciente serão preenchidos após a integração com o back-end.';
  mensagemTriagem.textContent = '';
  formTriagem.reset();
  areaTriagem.hidden = false;
  areaTriagem.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

botaoCancelarTriagem.addEventListener('click', () => {
  areaTriagem.hidden = true;
});

document.getElementById('visualizar-formulario-triagem').addEventListener('click', abrirFormularioTriagem);

formTriagem.addEventListener('submit', (event) => {
  event.preventDefault();
  mensagemTriagem.className = 'mensagem-triagem';

  if (!formTriagem.reportValidity()) return;

  const sistolica = Number(document.getElementById('pressao-sistolica').value);
  const diastolica = Number(document.getElementById('pressao-diastolica').value);
  if (sistolica && diastolica && sistolica < diastolica) {
    mensagemTriagem.textContent = 'A pressão sistólica deve ser maior ou igual à diastólica.';
    mensagemTriagem.classList.add('mensagem-erro');
    return;
  }

  mensagemTriagem.textContent = 'Dados validados no navegador. O envio e a gravação serão conectados ao back-end.';
  mensagemTriagem.classList.add('mensagem-aviso');
});
