const ERROS_PG = {
  '23505': { status: 409, detail: 'Registro duplicado' },
  '23503': { status: 404, detail: 'Registro relacionado não existe' },
  '23502': { status: 422, detail: 'Campo obrigatório ausente' },
  '22021': { status: 422, detail: 'Texto com caractere inválido' },
  '22P02': { status: 422, detail: 'Valor em formato inválido' },
};

function codigoPg(erro) {
  return (erro.cause ?? erro).code;
}

function mapearErroPg(erro) {
  return ERROS_PG[codigoPg(erro)] ?? null;
}

module.exports = { codigoPg, mapearErroPg };
