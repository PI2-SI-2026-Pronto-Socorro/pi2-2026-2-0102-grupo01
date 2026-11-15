const { eq, asc } = require('drizzle-orm');
const { db } = require('../db');
const {
  atendimento, paciente, triagem, queixa, consultaMedica, prescricao, prescricaoMedicacao, medicacao,
} = require('../db/schema');

async function buscarAtendimentoComPacientePorNumero(numeroAtendimento) {
  const [linhaEncontrada] = await db
    .select({ atendimento, paciente })
    .from(atendimento)
    .innerJoin(paciente, eq(paciente.id_paciente, atendimento.id_paciente))
    .where(eq(atendimento.numero_atendimento, numeroAtendimento));
  return linhaEncontrada ?? null;
}

async function buscarTriagemPorAtendimento(idAtendimento) {
  const [triagemEncontrada] = await db
    .select()
    .from(triagem)
    .where(eq(triagem.id_atendimento, idAtendimento));
  return triagemEncontrada ?? null;
}

async function listarQueixasPorTriagem(idTriagem) {
  return db
    .select()
    .from(queixa)
    .where(eq(queixa.id_triagem, idTriagem))
    .orderBy(asc(queixa.sintomas));
}

async function listarMedicacoesPorAtendimento(idAtendimento) {
  return db
    .select({
      id_prescricao: prescricao.id_prescricao,
      data_hora_prescricao: prescricao.data_hora,
      orientacoes: prescricao.orientacoes,
      medicamento: medicacao.medicamento,
      apresentacao: medicacao.apresentacao,
      concentracao: medicacao.concentracao,
      dose: prescricaoMedicacao.dose,
      intervalo_horas: prescricaoMedicacao.intervalo_horas,
      duracao_dias: prescricaoMedicacao.duracao_dias,
      via: prescricaoMedicacao.via,
      observacao: prescricaoMedicacao.observacao,
    })
    .from(consultaMedica)
    .innerJoin(prescricao, eq(prescricao.id_consulta, consultaMedica.id_consulta))
    .innerJoin(prescricaoMedicacao, eq(prescricaoMedicacao.id_prescricao, prescricao.id_prescricao))
    .innerJoin(medicacao, eq(medicacao.id_medicacao, prescricaoMedicacao.id_medicacao))
    .where(eq(consultaMedica.id_atendimento, idAtendimento))
    .orderBy(asc(prescricao.data_hora), asc(medicacao.medicamento));
}

module.exports = {
  buscarAtendimentoComPacientePorNumero,
  buscarTriagemPorAtendimento,
  listarQueixasPorTriagem,
  listarMedicacoesPorAtendimento,
};
