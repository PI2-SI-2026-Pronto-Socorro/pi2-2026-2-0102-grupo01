class ErroNegocio extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

module.exports = ErroNegocio;
