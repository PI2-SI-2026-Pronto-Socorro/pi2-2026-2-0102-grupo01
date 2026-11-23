const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const ConfirmacaoAtendimentoRepository = require('../repositories/ConfirmacaoAtendimentoRepository');
const ErroHttp = require('../utils/ErroHttp');
const { garantirTransicao, mensagemDeTransicaoRecusada } = require('../utils/transicoesAtendimento');

async function confirmarAtendimento(numeroAtendimento, usuario) {
  const numeroFormatado = String(numeroAtendimento).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroFormatado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');

  const atendimentoEncontrado = await AtendimentoRepository.findByNumero(numeroFormatado);
  if (!atendimentoEncontrado) throw new ErroHttp(404, 'Atendimento não encontrado');
  garantirTransicao(atendimentoEncontrado.status_atendimento, 'Confirmado');
  const medicoResponsavel = atendimentoEncontrado.id_profissional;
  if (usuario && medicoResponsavel && medicoResponsavel !== usuario.id_profissional) {
    throw new ErroHttp(409, 'Atendimento está com outro médico');
  }

  const quantidadeMedicacoes = await ConfirmacaoAtendimentoRepository.contarMedicacoesDoAtendimento(atendimentoEncontrado.id_atendimento);
  if (quantidadeMedicacoes === 0) {
    throw new ErroHttp(422, 'Registre ao menos uma medicação antes de confirmar o atendimento');
  }

  const atendimentoConfirmado = await ConfirmacaoAtendimentoRepository.passarDeTriadoParaConfirmado(
    atendimentoEncontrado.id_atendimento,
    usuario?.id_profissional,
  );
  if (atendimentoConfirmado) return atendimentoConfirmado;

  const atendimentoAtual = await AtendimentoRepository.findByNumero(numeroFormatado);
  if (atendimentoAtual?.status_atendimento !== atendimentoEncontrado.status_atendimento) {
    throw new ErroHttp(409, mensagemDeTransicaoRecusada(atendimentoAtual?.status_atendimento, 'Confirmado'));
  }
  throw new ErroHttp(409, 'Atendimento está com outro médico');
}

module.exports = { confirmarAtendimento };
