class Paciente {
  constructor({ id_paciente = null, nome, cpf, rg = null, data_nascimento, genero = null, telefone = null, status }) {
    this.id_paciente = id_paciente;
    this.nome = nome;
    this.cpf = cpf;
    this.rg = rg;
    this.data_nascimento = data_nascimento;
    this.genero = genero;
    this.telefone = telefone;
    if (status !== undefined) this.status = status;
  }

  paraInsercao() {
    return {
      nome: this.nome,
      cpf: this.cpf,
      rg: this.rg,
      data_nascimento: this.data_nascimento,
      genero: this.genero,
      telefone: this.telefone,
    };
  }
}

module.exports = Paciente;
