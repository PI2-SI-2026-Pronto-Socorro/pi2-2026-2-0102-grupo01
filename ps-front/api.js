async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`/api${caminho}`, {
    method: opcoes.method,
    headers: { 'Content-Type': 'application/json' },
    body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
  });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw Object.assign(new Error(dados?.detail ?? 'Erro na requisição'), { status: resposta.status });
  return dados;
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function numeroAtendimento(atendimento) {
  const ano = new Date(atendimento.data_hora_chegada).getFullYear();
  return `AT${String(atendimento.id_atendimento).padStart(4, '0')}/${ano}`;
}

function formatarCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(data) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
}

function badgeStatus(status) {
  const classe = status === 'Aberto' ? 'status-aberto' : 'text-bg-secondary';
  return `<span class="badge ${classe} fw-medium d-inline-flex align-items-center gap-1"><span class="rounded-circle d-inline-block" style="width:6px;height:6px;background:currentColor"></span>${escapar(status)}</span>`;
}

function alerta(tipo, mensagem) {
  return `<div class="alert alert-${tipo} mb-0">${escapar(mensagem)}</div>`;
}

document.querySelectorAll('[data-relogio]').forEach((elemento) => {
  const agora = new Date();
  const dia = agora.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  elemento.textContent = `${dia[0].toUpperCase()}${dia.slice(1)} ${agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${formatarHora(agora)}`;
});

const contadoresFila = document.querySelectorAll('[data-contador-fila]');
if (contadoresFila.length) {
  requisitar('/atendimentos/abertos')
    .then((abertos) => contadoresFila.forEach((elemento) => { elemento.textContent = abertos.length; }))
    .catch(() => contadoresFila.forEach((elemento) => { elemento.textContent = ''; }));
}
