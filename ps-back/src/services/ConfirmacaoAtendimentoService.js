const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const ConfirmacaoAtendimentoRepository = require('../repositories/ConfirmacaoAtendimentoRepository');
const ErroHttp = require('../utils/ErroHttp');

async function confirmarAtendimento(numeroAtendimento) {
  const numeroFormatado = String(numeroAtendimento).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroFormatado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');

  const atendimentoEncontrado = await AtendimentoRepository.findByNumero(numeroFormatado);
  if (!atendimentoEncontrado) throw new ErroHttp(404, 'Atendimento não encontrado');
  if (atendimentoEncontrado.status_atendimento !== 'Triado') {
    throw new ErroHttp(409, `Só é possível confirmar atendimento Triado (status: ${atendimentoEncontrado.status_atendimento})`);
  }

  const quantidadeMedicacoes = await ConfirmacaoAtendimentoRepository.contarMedicacoesDoAtendimento(atendimentoEncontrado.id_atendimento);
  if (quantidadeMedicacoes === 0) {
    throw new ErroHttp(422, 'Registre ao menos uma medicação antes de confirmar o atendimento');
  }

  const atendimentoConfirmado = await ConfirmacaoAtendimentoRepository.passarDeTriadoParaConfirmado(atendimentoEncontrado.id_atendimento);
  if (!atendimentoConfirmado) throw new ErroHttp(409, 'O atendimento mudou de situação; consulte e tente novamente');
  return atendimentoConfirmado;
}

module.exports = { confirmarAtendimento };
