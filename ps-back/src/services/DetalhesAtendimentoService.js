const DetalhesAtendimentoRepository = require('../repositories/DetalhesAtendimentoRepository');
const ErroHttp = require('../utils/ErroHttp');

async function buscarDetalhesAtendimento(numeroAtendimento) {
  const numeroFormatado = String(numeroAtendimento).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroFormatado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');

  const atendimentoComPaciente = await DetalhesAtendimentoRepository.buscarAtendimentoComPacientePorNumero(numeroFormatado);
  if (!atendimentoComPaciente) throw new ErroHttp(404, 'Atendimento não encontrado');

  const { atendimento, paciente } = atendimentoComPaciente;
  const triagemEncontrada = await DetalhesAtendimentoRepository.buscarTriagemPorAtendimento(atendimento.id_atendimento);
  const queixasDaTriagem = triagemEncontrada
    ? await DetalhesAtendimentoRepository.listarQueixasPorTriagem(triagemEncontrada.id_triagem)
    : [];

  const sinaisVitais = triagemEncontrada
    ? {
      pressao_sistolica: triagemEncontrada.pressao_sistolica,
      pressao_diastolica: triagemEncontrada.pressao_diastolica,
      temperatura: triagemEncontrada.temperatura === null ? null : Number(triagemEncontrada.temperatura),
      frequencia_cardiaca: triagemEncontrada.frequencia_cardiaca,
      classificacao_risco: triagemEncontrada.classificacao_risco,
      data_hora_triagem: triagemEncontrada.data_hora_triagem,
    }
    : null;

  return { atendimento, paciente, sinais_vitais: sinaisVitais, queixas: queixasDaTriagem };
}

module.exports = { buscarDetalhesAtendimento };
