const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const MedicacaoRepository = require('../repositories/MedicacaoRepository');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_QUE_ACEITAM_MEDICACAO = ['Triado'];

function textoOpcional(valorRecebido, nomeExibido, tamanhoMaximo) {
  if (valorRecebido == null) return null;
  const textoLimpo = String(valorRecebido).trim();
  if (!textoLimpo) return null;
  if (textoLimpo.length > tamanhoMaximo) throw new ErroHttp(422, `${nomeExibido} deve ter até ${tamanhoMaximo} caracteres`);
  return textoLimpo;
}

function textoObrigatorio(valorRecebido, nomeExibido, tamanhoMaximo) {
  const textoLimpo = textoOpcional(valorRecebido, nomeExibido, tamanhoMaximo);
  if (!textoLimpo) throw new ErroHttp(422, `${nomeExibido} é obrigatório`);
  return textoLimpo;
}

function inteiroNaFaixa(valorRecebido, nomeExibido, minimo, maximo, obrigatorio) {
  if (valorRecebido == null || valorRecebido === '') {
    if (obrigatorio) throw new ErroHttp(422, `${nomeExibido} é obrigatório`);
    return null;
  }
  const valorNumerico = Number(valorRecebido);
  if (!Number.isInteger(valorNumerico) || valorNumerico < minimo || valorNumerico > maximo) {
    throw new ErroHttp(422, `${nomeExibido} deve ser um número inteiro entre ${minimo} e ${maximo}`);
  }
  return valorNumerico;
}

function validarMedicacao(dadosMedicacao) {
  return {
    medicamento: textoObrigatorio(dadosMedicacao?.medicamento, 'Medicamento', 100),
    apresentacao: textoOpcional(dadosMedicacao?.apresentacao, 'Apresentação', 50),
    concentracao: textoOpcional(dadosMedicacao?.concentracao, 'Concentração', 50),
    dose: textoObrigatorio(dadosMedicacao?.dose, 'Dose', 50),
    intervalo_horas: inteiroNaFaixa(dadosMedicacao?.intervalo_horas, 'Intervalo (horas)', 1, 168, true),
    duracao_dias: inteiroNaFaixa(dadosMedicacao?.duracao_dias, 'Duração (dias)', 1, 365, false),
    via: textoOpcional(dadosMedicacao?.via, 'Via', 30),
    observacao: textoOpcional(dadosMedicacao?.observacao, 'Observação', 255),
  };
}

async function registrarMedicacoes(numeroAtendimento, dadosRecebidos) {
  const numeroFormatado = String(numeroAtendimento).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroFormatado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');

  const { id_profissional, medicacoes: listaRecebida } = dadosRecebidos;
  if (typeof id_profissional !== 'string' || !FORMATO_UUID.test(id_profissional)) {
    throw new ErroHttp(422, 'id_profissional inválido');
  }
  if (!Array.isArray(listaRecebida) || listaRecebida.length === 0) {
    throw new ErroHttp(422, 'Informe ao menos uma medicação');
  }
  const medicacoesValidas = listaRecebida.map(validarMedicacao);
  const orientacoes = textoOpcional(dadosRecebidos.orientacoes, 'Orientações', 2000);

  const atendimento = await AtendimentoRepository.findByNumero(numeroFormatado);
  if (!atendimento) throw new ErroHttp(404, 'Atendimento não encontrado');
  if (!STATUS_QUE_ACEITAM_MEDICACAO.includes(atendimento.status_atendimento)) {
    throw new ErroHttp(409, `Só é possível registrar medicação em atendimento Triado (status: ${atendimento.status_atendimento})`);
  }

  try {
    return await MedicacaoRepository.gravarPrescricaoComMedicacoes(
      atendimento.id_atendimento,
      id_profissional,
      orientacoes,
      medicacoesValidas,
    );
  } catch (erro) {
    const codigoErroBanco = codigoPg(erro);
    if (codigoErroBanco === '23505') throw new ErroHttp(409, 'O mesmo medicamento foi informado mais de uma vez');
    if (codigoErroBanco === '23503') throw new ErroHttp(404, 'Profissional não existe');
    throw erro;
  }
}

module.exports = { registrarMedicacoes };
