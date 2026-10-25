const ErroNegocio = require('../utils/ErroNegocio');
const { mapearErroPg } = require('../utils/pgHelpers');

function rota(fn) {
  return (req, res) => fn(req, res).catch((erro) => {
    if (erro instanceof ErroNegocio) return res.status(erro.status).json({ detail: erro.detail });
    const mapeado = mapearErroPg(erro);
    if (mapeado) return res.status(mapeado.status).json({ detail: mapeado.detail });
    console.error(erro);
    res.status(500).json({ detail: 'Erro interno no servidor' });
  });
}

module.exports = rota;
