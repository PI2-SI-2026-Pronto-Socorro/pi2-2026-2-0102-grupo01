const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const AltaAtendimentoRepository = require('../repositories/AltaAtendimentoRepository');
const ErroHttp = require('../utils/ErroHttp');

async function listarConfirmados() {
  return AltaAtendimentoRepository.listarAtendimentosConfirmados();
}

async function darAlta(numeroAtendimento) {
  const numeroFormatado = String(numeroAtendimento).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroFormatado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');

  const atendimentoEncontrado = await AtendimentoRepository.findByNumero(numeroFormatado);
  if (!atendimentoEncontrado) throw new ErroHttp(404, 'Atendimento não encontrado');
  if (atendimentoEncontrado.status_atendimento !== 'Confirmado') {
    throw new ErroHttp(409, `Só é possível dar alta em atendimento Confirmado (status: ${atendimentoEncontrado.status_atendimento})`);
  }

  const atendimentoEncerrado = await AltaAtendimentoRepository.passarDeConfirmadoParaEncerrado(atendimentoEncontrado.id_atendimento);
  if (!atendimentoEncerrado) throw new ErroHttp(409, 'O atendimento mudou de situação; consulte e tente novamente');
  return atendimentoEncerrado;
}

module.exports = { listarConfirmados, darAlta };
