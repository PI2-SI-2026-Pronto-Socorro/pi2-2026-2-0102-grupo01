const AtendimentoRepository = require('../repositories/AtendimentoRepository');
const TriagemRepository = require('../repositories/TriagemRepository');
const ErroHttp = require('../utils/ErroHttp');
const { codigoPg } = require('../utils/pgHelpers');

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LIMITES_SINAIS_VITAIS = {
  pressao_sistolica: { minimo: 50, maximo: 300, somenteInteiro: true, nomeExibido: 'Pressão sistólica (mmHg)' },
  pressao_diastolica: { minimo: 20, maximo: 200, somenteInteiro: true, nomeExibido: 'Pressão diastólica (mmHg)' },
  temperatura: { minimo: 25, maximo: 45, somenteInteiro: false, nomeExibido: 'Temperatura (°C)' },
  frequencia_cardiaca: { minimo: 20, maximo: 300, somenteInteiro: true, nomeExibido: 'Batimentos (bpm)' },
};

function validarSinalVital(nomeCampo, valorRecebido) {
  const { minimo, maximo, somenteInteiro, nomeExibido } = LIMITES_SINAIS_VITAIS[nomeCampo];
  const valorNumerico = typeof valorRecebido === 'string' && valorRecebido.trim() !== '' ? Number(valorRecebido) : valorRecebido;

  if (typeof valorNumerico !== 'number' || !Number.isFinite(valorNumerico)) {
    throw new ErroHttp(422, `${nomeExibido} é obrigatório e deve ser numérico`);
  }
  if (somenteInteiro && !Number.isInteger(valorNumerico)) {
    throw new ErroHttp(422, `${nomeExibido} deve ser inteiro`);
  }
  if (valorNumerico < minimo || valorNumerico > maximo) {
    throw new ErroHttp(422, `${nomeExibido} fora da faixa permitida (${minimo} a ${maximo})`);
  }
  return valorNumerico;
}

function validarQueixas(listaQueixas) {
  if (!Array.isArray(listaQueixas) || listaQueixas.length === 0) throw new ErroHttp(422, 'Informe ao menos uma queixa');

  return listaQueixas.map((queixa) => {
    const sintomas = typeof queixa?.sintomas === 'string' ? queixa.sintomas.trim() : '';
    if (!sintomas) throw new ErroHttp(422, 'Toda queixa precisa de sintomas');

    const duracaoSintoma = queixa.duracao_sintoma == null ? null : String(queixa.duracao_sintoma).trim() || null;
    if (duracaoSintoma && duracaoSintoma.length > 50) throw new ErroHttp(422, 'Duração do sintoma deve ter até 50 caracteres');

    return { sintomas, duracao_sintoma: duracaoSintoma };
  });
}

async function registrarTriagem(numeroAtendimento, dadosTriagem) {
  const numeroFormatado = String(numeroAtendimento).toUpperCase();
  if (!/^AT\d{4,9}$/.test(numeroFormatado)) throw new ErroHttp(422, 'Número do atendimento inválido (ex.: AT0001)');

  const { id_profissional, classificacao_risco } = dadosTriagem;
  if (typeof id_profissional !== 'string' || !FORMATO_UUID.test(id_profissional)) {
    throw new ErroHttp(422, 'id_profissional inválido');
  }

  const sinaisVitais = {};
  for (const nomeCampo of Object.keys(LIMITES_SINAIS_VITAIS)) {
    sinaisVitais[nomeCampo] = validarSinalVital(nomeCampo, dadosTriagem[nomeCampo]);
  }
  if (sinaisVitais.pressao_sistolica < sinaisVitais.pressao_diastolica) {
    throw new ErroHttp(422, 'Pressão sistólica não pode ser menor que a diastólica');
  }
  const queixasValidas = validarQueixas(dadosTriagem.queixas);

  const atendimento = await AtendimentoRepository.findByNumero(numeroFormatado);
  if (!atendimento) throw new ErroHttp(404, 'Atendimento não encontrado');

  try {
    return await TriagemRepository.criarTriagemComQueixas({
      id_atendimento: atendimento.id_atendimento,
      id_profissional,
      classificacao_risco,
      ...sinaisVitais,
      temperatura: String(sinaisVitais.temperatura),
    }, queixasValidas);
  } catch (erro) {
    const codigoErroBanco = codigoPg(erro);
    if (codigoErroBanco === '23505') throw new ErroHttp(409, 'Atendimento já possui triagem');
    if (codigoErroBanco === '23503') throw new ErroHttp(404, 'Profissional não existe');
    if (codigoErroBanco === '23514') throw new ErroHttp(422, 'Valor fora da faixa permitida');
    throw erro;
  }
}

module.exports = { registrarTriagem, LIMITES_SINAIS_VITAIS };
