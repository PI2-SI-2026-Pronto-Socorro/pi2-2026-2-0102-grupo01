const { asc } = require('drizzle-orm');
const { db } = require('../db');
const { profissional } = require('../db/schema');

async function listarProfissionaisPorNome() {
  return db
    .select({
      id_profissional: profissional.id_profissional,
      nome: profissional.nome,
      cargo: profissional.cargo,
    })
    .from(profissional)
    .orderBy(asc(profissional.nome));
}

async function create(dados) {
  const [linha] = await db.insert(profissional).values(dados).returning();
  return linha;
}

module.exports = { listarProfissionaisPorNome, create };
