class Atendimento {
  constructor({
    id_atendimento = null, numero_atendimento = null, id_paciente, status_atendimento = 'Aberto', data_hora_chegada,
    motivo_atendimento, data_hora_saida, id_profissional,
  }) {
    this.id_atendimento = id_atendimento;
    this.numero_atendimento = numero_atendimento;
    this.id_paciente = id_paciente;
    this.status_atendimento = status_atendimento;
    if (data_hora_chegada !== undefined) this.data_hora_chegada = data_hora_chegada;
    if (motivo_atendimento !== undefined) this.motivo_atendimento = motivo_atendimento;
    if (data_hora_saida !== undefined) this.data_hora_saida = data_hora_saida;
    if (id_profissional !== undefined) this.id_profissional = id_profissional;
  }

  paraInsercao() {
    return { id_paciente: this.id_paciente, status_atendimento: this.status_atendimento };
  }
}

module.exports = Atendimento;
