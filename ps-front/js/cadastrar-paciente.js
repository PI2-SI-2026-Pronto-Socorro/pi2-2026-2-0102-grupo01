const formulario = document.getElementById('form-paciente');
const mensagem = document.getElementById('mensagem');
const botaoCadastrar = document.getElementById('botao-cadastrar');

document.getElementById('cpf').value = new URLSearchParams(location.search).get('cpf') ?? '';

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const valor = (id) => document.getElementById(id).value.trim();
  const cpf = valor('cpf').replace(/\D/g, '');

  botaoCadastrar.disabled = true;
  mensagem.innerHTML = '';
  try {
    await requisitar('/pacientes', {
      method: 'POST',
      corpo: {
        nome: valor('nome-completo'),
        cpf,
        data_nascimento: valor('data-nascimento'),
        genero: valor('sexo'),
        telefone: valor('telefone') || null,
      },
    });
    location.href = `./h04-abrir-atendimento.html?cpf=${cpf}`;
  } catch (erro) {
    mensagem.innerHTML = alerta('danger', erro.message);
    botaoCadastrar.disabled = false;
  }
});
