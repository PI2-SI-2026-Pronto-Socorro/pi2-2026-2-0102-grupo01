const { eq, and, desc, isNull } = require('drizzle-orm');
const { db } = require('../db');
const { consultaMedica, prescricao, medicacao, prescricaoMedicacao } = require('../db/schema');
const { travarAtendimento } = require('./AtendimentoRepository');

async function buscarOuCriarConsultaAberta(transacao, idAtendimento, idProfissional) {
  const [consultaAberta] = await transacao
    .select()
    .from(consultaMedica)
    .where(and(eq(consultaMedica.id_atendimento, idAtendimento), isNull(consultaMedica.data_hora_fim)))
    .orderBy(desc(consultaMedica.data_hora_inicio))
    .limit(1);
  if (consultaAberta) return consultaAberta;

  const [consultaCriada] = await transacao
    .insert(consultaMedica)
    .values({ id_atendimento: idAtendimento, id_profissional: idProfissional })
    .returning();
  return consultaCriada;
}

async function buscarOuCriarMedicamento(transacao, dadosMedicamento) {
  const { medicamento: nomeMedicamento, apresentacao, concentracao } = dadosMedicamento;
  await transacao
    .insert(medicacao)
    .values({ medicamento: nomeMedicamento, apresentacao, concentracao })
    .onConflictDoNothing();

  const [medicamentoEncontrado] = await transacao
    .select()
    .from(medicacao)
    .where(and(
      eq(medicacao.medicamento, nomeMedicamento),
      apresentacao === null ? isNull(medicacao.apresentacao) : eq(medicacao.apresentacao, apresentacao),
      concentracao === null ? isNull(medicacao.concentracao) : eq(medicacao.concentracao, concentracao),
    ));
  return medicamentoEncontrado;
}

async function gravarPrescricaoComMedicacoes(idAtendimento, idProfissional, orientacoes, listaMedicacoes) {
  return db.transaction(async (transacao) => {
    const atendimentoTravado = await travarAtendimento(transacao, idAtendimento);
    const statusAtualDoAtendimento = atendimentoTravado?.status_atendimento ?? null;
    if (statusAtualDoAtendimento !== 'Triado') return { gravado: false, statusAtualDoAtendimento };
    const medicoResponsavel = atendimentoTravado.id_profissional;
    if (medicoResponsavel && medicoResponsavel !== idProfissional) return { gravado: false, comOutroMedico: true };

    const consulta = await buscarOuCriarConsultaAberta(transacao, idAtendimento, idProfissional);

    const [prescricaoCriada] = await transacao
      .insert(prescricao)
      .values({ id_consulta: consulta.id_consulta, orientacoes })
      .returning();

    const medicacoesGravadas = [];
    for (const dadosMedicacao of listaMedicacoes) {
      const medicamentoCadastrado = await buscarOuCriarMedicamento(transacao, dadosMedicacao);
      const [itemPrescricao] = await transacao
        .insert(prescricaoMedicacao)
        .values({
          id_prescricao: prescricaoCriada.id_prescricao,
          id_medicacao: medicamentoCadastrado.id_medicacao,
          dose: dadosMedicacao.dose,
          intervalo_horas: dadosMedicacao.intervalo_horas,
          duracao_dias: dadosMedicacao.duracao_dias,
          via: dadosMedicacao.via,
          observacao: dadosMedicacao.observacao,
        })
        .returning();
      medicacoesGravadas.push({ ...medicamentoCadastrado, ...itemPrescricao });
    }

    return { gravado: true, prescricaoGravada: { ...prescricaoCriada, medicacoes: medicacoesGravadas } };
  });
}

module.exports = { gravarPrescricaoComMedicacoes };
