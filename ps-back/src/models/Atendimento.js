class Atendimento {
  constructor({
    id_atendimento = null, numero_atendimento = null, id_paciente, status_atendimento = 'Aberto', data_hora_chegada,
  }) {
    this.id_atendimento = id_atendimento;
    this.numero_atendimento = numero_atendimento;
    this.id_paciente = id_paciente;
    this.status_atendimento = status_atendimento;
    if (data_hora_chegada !== undefined) this.data_hora_chegada = data_hora_chegada;
  }

  paraInsercao() {
    return { id_paciente: this.id_paciente, status_atendimento: this.status_atendimento };
  }
}

module.exports = Atendimento;
