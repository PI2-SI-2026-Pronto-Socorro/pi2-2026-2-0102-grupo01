const corpoTabela = document.getElementById('tabela-atendimentos');
const totalAbertos = document.getElementById('total-abertos');

requisitar('/atendimentos/abertos')
  .then((abertos) => {
    totalAbertos.textContent = abertos.length;
    if (!abertos.length) return;
    corpoTabela.innerHTML = abertos.map((atendimento) => `
      <tr>
        <td class="ps-4"><a class="link-primary text-decoration-none" href="./h05-consultar-atendimento.html?numero=${atendimento.id_atendimento}">${numeroAtendimento(atendimento)}</a></td>
        <td class="fw-medium">${escapar(atendimento.nome)}</td>
        <td>${formatarCpf(atendimento.cpf)}</td>
        <td>${badgeStatus(atendimento.status)}</td>
        <td class="pe-4">${formatarHora(atendimento.data_hora_chegada)}</td>
      </tr>`).join('');
  })
  .catch((erro) => {
    corpoTabela.innerHTML = `<tr><td colspan="5" class="p-3">${alerta('danger', erro.message)}</td></tr>`;
  });
