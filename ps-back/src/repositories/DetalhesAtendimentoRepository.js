const { eq, asc } = require('drizzle-orm');
const { db } = require('../db');
const { atendimento, paciente, triagem, queixa } = require('../db/schema');

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

module.exports = { buscarAtendimentoComPacientePorNumero, buscarTriagemPorAtendimento, listarQueixasPorTriagem };
