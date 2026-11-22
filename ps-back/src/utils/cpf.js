function digitoVerificador(base) {
  const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * (base.length + 1 - indice), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function cpfComDigitosValidos(cpf) {
  if (typeof cpf !== 'string' || !/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  return digitoVerificador(cpf.slice(0, 9)) === Number(cpf[9])
    && digitoVerificador(cpf.slice(0, 10)) === Number(cpf[10]);
}

module.exports = { cpfComDigitosValidos };
