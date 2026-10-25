class Atendimento {
  constructor({ id_atendimento = null, id_paciente, status = 'Aberto', data_hora_chegada }) {
    this.id_atendimento = id_atendimento;
    this.id_paciente = id_paciente;
    this.status = status;
    if (data_hora_chegada !== undefined) this.data_hora_chegada = data_hora_chegada;
  }

  paraInsercao() {
    return { id_paciente: this.id_paciente, status: this.status };
  }
}

module.exports = Atendimento;
