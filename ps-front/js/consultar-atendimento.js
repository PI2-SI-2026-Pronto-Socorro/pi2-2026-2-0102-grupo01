const formulario = document.getElementById('form-consulta');
const campo = document.getElementById('numero-atendimento');
const rotulo = document.querySelector('label[for="numero-atendimento"]');
const resultado = document.getElementById('resultado');
const botaoConsultar = document.getElementById('botao-consultar');

function porCpf() {
  return document.getElementById('busca-cpf').checked;
}

document.querySelectorAll('[name="tipo-busca"]').forEach((opcao) => {
  opcao.addEventListener('change', () => {
    rotulo.textContent = porCpf() ? 'CPF do paciente' : 'Número do atendimento';
    campo.placeholder = porCpf() ? '000.000.000-00' : 'AT0001/2026';
    campo.value = '';
    campo.dataset.mascara = porCpf() ? 'cpf' : '';
    resultado.innerHTML = '';
  });
});

function cartao(atendimento) {
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-body p-4">
        <div class="d-flex align-items-center gap-2">
          <h2 class="h5 fw-semibold mb-0">${numeroAtendimento(atendimento)}</h2>
          ${badgeStatus(atendimento.status)}
        </div>
        <hr />
        <div class="row row-cols-1 row-cols-md-3 g-3">
          <div class="col"><div class="small text-body-secondary">Paciente</div><div class="fw-medium">${escapar(atendimento.nome)}</div></div>
          <div class="col"><div class="small text-body-secondary">CPF</div><div class="fw-medium">${formatarCpf(atendimento.cpf)}</div></div>
          <div class="col"><div class="small text-body-secondary">Chegada</div><div class="fw-medium">${formatarDataHora(atendimento.data_hora_chegada)}</div></div>
        </div>
      </div>
    </div>`;
}

async function consultar() {
  const digitos = porCpf() ? campo.value.replace(/\D/g, '') : (campo.value.match(/\d+/)?.[0] ?? '0');
  botaoConsultar.disabled = true;
  resultado.innerHTML = '';
  try {
    const atendimentos = porCpf()
      ? await requisitar(`/atendimentos?cpf=${digitos}`)
      : [await requisitar(`/atendimentos/${digitos}`)];
    resultado.innerHTML = atendimentos.length
      ? atendimentos.map(cartao).join('')
      : alerta('light border', 'Nenhum atendimento encontrado para este CPF.');
  } catch (erro) {
    resultado.innerHTML = alerta(erro.status === 404 ? 'warning' : 'danger', erro.message);
  } finally {
    botaoConsultar.disabled = false;
  }
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  consultar();
});

const numeroInicial = new URLSearchParams(location.search).get('numero');
if (numeroInicial) {
  campo.value = numeroInicial;
  consultar();
}
