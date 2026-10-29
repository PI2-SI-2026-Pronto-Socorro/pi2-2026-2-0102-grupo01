const cpf = new URLSearchParams(location.search).get('cpf') ?? '';
const ficha = document.getElementById('ficha');
const mensagem = document.getElementById('mensagem');
const botaoAbrir = document.getElementById('botao-abrir-atendimento');
const modal = new bootstrap.Modal('#modal-atendimento-aberto');
let paciente;

function preencher(campo, valor) {
  document.querySelector(`[data-campo="${campo}"]`).textContent = valor;
}

requisitar(`/pacientes/${encodeURIComponent(cpf)}`)
  .then((dados) => {
    paciente = dados;
    preencher('nome', paciente.nome);
    preencher('cpf', `CPF ${formatarCpf(paciente.cpf)}`);
    preencher('nascimento', formatarData(paciente.data_nascimento));
    preencher('sexo', paciente.genero ?? '—');
    preencher('telefone', paciente.telefone ?? '—');
    ficha.classList.remove('d-none');
  })
  .catch((erro) => {
    mensagem.innerHTML = alerta(erro.status === 404 ? 'warning' : 'danger', erro.message);
  });

botaoAbrir.addEventListener('click', async () => {
  botaoAbrir.disabled = true;
  mensagem.innerHTML = '';
  try {
    const atendimento = await requisitar('/atendimentos', { method: 'POST', corpo: { id_paciente: paciente.id_paciente } });
    document.getElementById('modal-numero').textContent = numeroAtendimento(atendimento);
    document.getElementById('modal-chegada').textContent = formatarDataHora(atendimento.data_hora_chegada);
    modal.show();
  } catch (erro) {
    mensagem.innerHTML = alerta(erro.status === 409 ? 'warning' : 'danger', erro.message);
  } finally {
    botaoAbrir.disabled = false;
  }
});

document.getElementById('botao-copiar').addEventListener('click', () => {
  navigator.clipboard?.writeText(document.getElementById('modal-numero').textContent);
});

document.getElementById('botao-imprimir').addEventListener('click', () => window.print());
