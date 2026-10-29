const corpoTabela = document.getElementById('tabela-fila');
const totalFila = document.getElementById('total-fila');
const botaoAtualizar = document.getElementById('botao-atualizar');

async function carregarFila() {
  botaoAtualizar.disabled = true;
  try {
    const abertos = await requisitar('/atendimentos/abertos');
    totalFila.textContent = `${abertos.length} em Aberto`;
    corpoTabela.innerHTML = abertos.length
      ? abertos.map((atendimento, posicao) => `
        <tr>
          <td class="text-body-secondary ps-4">${posicao + 1}</td>
          <td>${numeroAtendimento(atendimento)}</td>
          <td class="fw-medium">${escapar(atendimento.nome)}</td>
          <td>${formatarHora(atendimento.data_hora_chegada)}</td>
          <td class="text-end pe-4"><button class="btn btn-sm btn-light" type="button" disabled>Triar</button></td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="text-center text-body-secondary py-5">Nenhum paciente aguardando triagem.</td></tr>';
  } catch (erro) {
    corpoTabela.innerHTML = `<tr><td colspan="5" class="p-3">${alerta('danger', erro.message)}</td></tr>`;
  } finally {
    botaoAtualizar.disabled = false;
  }
}

botaoAtualizar.addEventListener('click', carregarFila);
carregarFila();
