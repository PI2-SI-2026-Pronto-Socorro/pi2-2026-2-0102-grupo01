const { asc, eq } = require('drizzle-orm');
const { db } = require('../db');
const { profissional } = require('../db/schema');

const CAMPOS_PUBLICOS = {
  id_profissional: profissional.id_profissional,
  nome: profissional.nome,
  cpf: profissional.cpf,
  telefone: profissional.telefone,
  cargo: profissional.cargo,
  registro_profissional: profissional.registro_profissional,
  plantao: profissional.plantao,
  especialidade: profissional.especialidade,
  perfil: profissional.perfil,
  usuario: profissional.usuario,
};

async function listarProfissionaisPorNome() {
  return db
    .select({
      id_profissional: profissional.id_profissional,
      nome: profissional.nome,
      cargo: profissional.cargo,
      perfil: profissional.perfil,
    })
    .from(profissional)
    .orderBy(asc(profissional.nome));
}

async function existeComPerfil(perfil) {
  const [linha] = await db.select({ id: profissional.id_profissional }).from(profissional)
    .where(eq(profissional.perfil, perfil)).limit(1);
  return Boolean(linha);
}

async function cadastrar(dados) {
  const [linha] = await db.insert(profissional).values(dados).returning(CAMPOS_PUBLICOS);
  return linha;
}

async function buscarPorUsuario(usuario) {
  const [linha] = await db.select().from(profissional).where(eq(profissional.usuario, usuario));
  return linha ?? null;
}

async function buscarPorId(idProfissional) {
  const [linha] = await db.select(CAMPOS_PUBLICOS).from(profissional)
    .where(eq(profissional.id_profissional, idProfissional));
  return linha ?? null;
}

module.exports = { listarProfissionaisPorNome, existeComPerfil, cadastrar, buscarPorUsuario, buscarPorId };
