function rota(fn) {
  return (req, res) => fn(req, res).catch((erro) => {
    console.error(erro);
    res.status(500).json({ detail: 'Erro interno no servidor' });
  });
}

module.exports = rota;
