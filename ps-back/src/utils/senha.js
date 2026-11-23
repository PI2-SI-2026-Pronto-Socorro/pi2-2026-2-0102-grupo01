const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const TAMANHO_DA_CHAVE = 64;
const HASH_PARA_COMPARACAO_VAZIA = `scrypt$${'0'.repeat(32)}$${'0'.repeat(TAMANHO_DA_CHAVE * 2)}`;

async function gerarHashSenha(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const chave = await scrypt(senha, sal, TAMANHO_DA_CHAVE);
  return `scrypt$${sal}$${chave.toString('hex')}`;
}

function hashTemFormatoValido(hashSalvo) {
  const [algoritmo, sal, chaveSalva] = String(hashSalvo ?? '').split('$');
  return algoritmo === 'scrypt' && Boolean(sal) && /^[0-9a-f]+$/.test(chaveSalva ?? '')
    && chaveSalva.length === TAMANHO_DA_CHAVE * 2;
}

async function senhaConfere(senha, hashSalvo) {
  const formatoValido = hashTemFormatoValido(hashSalvo);
  const [, sal, chaveSalva] = (formatoValido ? hashSalvo : HASH_PARA_COMPARACAO_VAZIA).split('$');
  const chaveCalculada = await scrypt(String(senha), sal, TAMANHO_DA_CHAVE);
  const iguais = crypto.timingSafeEqual(chaveCalculada, Buffer.from(chaveSalva, 'hex'));
  return formatoValido && iguais;
}

module.exports = { gerarHashSenha, senhaConfere };
