const crypto = require('crypto');

const VALIDADE_EM_HORAS = 12;
const TAMANHO_MINIMO_DO_SEGREDO = 32;
const PREFIXO_DOS_VALORES_DE_EXEMPLO = 'COLE_AQUI';

function segredoValido(segredo) {
  return typeof segredo === 'string'
    && segredo.length >= TAMANHO_MINIMO_DO_SEGREDO
    && !segredo.toUpperCase().startsWith(PREFIXO_DOS_VALORES_DE_EXEMPLO);
}

const SEGREDO = segredoValido(process.env.AUTH_SECRET)
  ? process.env.AUTH_SECRET
  : crypto.randomBytes(32).toString('hex');

function assinar(conteudo) {
  return crypto.createHmac('sha256', SEGREDO).update(conteudo).digest('base64url');
}

function gerarToken(dados) {
  const expiraEm = Date.now() + VALIDADE_EM_HORAS * 60 * 60 * 1000;
  const conteudo = Buffer.from(JSON.stringify({ ...dados, exp: expiraEm })).toString('base64url');
  return { token: `${conteudo}.${assinar(conteudo)}`, expira_em: new Date(expiraEm).toISOString() };
}

function lerToken(token) {
  const [conteudo, assinatura] = String(token ?? '').split('.');
  if (!conteudo || !assinatura) return null;
  const esperada = Buffer.from(assinar(conteudo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !crypto.timingSafeEqual(esperada, recebida)) return null;
  try {
    const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'));
    return dados.exp > Date.now() ? dados : null;
  } catch {
    return null;
  }
}

module.exports = {
  TAMANHO_MINIMO_DO_SEGREDO, segredoValido, gerarToken, lerToken,
};
