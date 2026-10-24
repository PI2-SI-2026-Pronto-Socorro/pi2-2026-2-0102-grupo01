const express = require('express');
const path = require('path');
const { eq, desc, count } = require('drizzle-orm');
const db = require('./db');
const { paciente, atendimento } = require('./schema');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'ps-front'))); // serve o front

// ---------- Util ----------

async function statusAtual(idPaciente) {
  const [ultimo] = await db
    .select({ status: atendimento.status })
    .from(atendimento)
    .where(eq(atendimento.id_paciente, idPaciente))
    .orderBy(desc(atendimento.data_hora_chegada))
    .limit(1);
  return ultimo ? ultimo.status : null;
}

function textoOpcional(valor, max) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.length <= max);
}

function validarPaciente(p) {
  if (typeof p.nome !== 'string' || p.nome.length < 1 || p.nome.length > 100) return 'Nome inválido';
  if (typeof p.cpf !== 'string' || !/^\d{11}$/.test(p.cpf)) return 'CPF deve ter 11 números';
  if (typeof p.data_nascimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.data_nascimento)
      || isNaN(new Date(p.data_nascimento))) return 'Data de nascimento inválida (use AAAA-MM-DD)';
  if (!textoOpcional(p.genero, 20)) return 'Gênero inválido';
  if (!textoOpcional(p.telefone, 15)) return 'Telefone inválido';
  return null;
}

// Express 4 não captura erro de função async: sem isso a requisição ficaria pendurada.
function rota(fn) {
  return (req, res) => fn(req, res).catch((erro) => {
    console.error(erro);
    res.status(500).json({ detail: 'Erro interno no servidor' });
  });
}

// ---------- Rotas ----------

// Operação de teste: confirma a conexão lendo a tabela paciente
app.get('/api/health', async (req, res) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(paciente);
    res.json({ banco: 'ok', pacientes: total });
  } catch (erro) {
    res.status(500).json({ banco: 'erro', detail: erro.message });
  }
});

app.get('/api/pacientes', rota(async (req, res) => {
  res.json(await db.select().from(paciente));
}));

app.get('/api/pacientes/:cpf', rota(async (req, res) => {
  const [encontrado] = await db.select().from(paciente).where(eq(paciente.cpf, req.params.cpf));
  if (!encontrado) return res.status(404).json({ detail: 'Paciente não encontrado' });
  res.json({ ...encontrado, status: await statusAtual(encontrado.id_paciente) });
}));

app.post('/api/pacientes', rota(async (req, res) => {
  const body = req.body || {};
  const erro = validarPaciente(body);
  if (erro) return res.status(422).json({ detail: erro });

  try {
    const [novo] = await db.insert(paciente).values({
      nome: body.nome,
      cpf: body.cpf,
      data_nascimento: body.data_nascimento,
      genero: body.genero ?? null,
      telefone: body.telefone ?? null,
    }).returning();
    res.status(201).json(novo);
  } catch (e) {
    // 23505 = violação de UNIQUE no PostgreSQL (CPF repetido)
    if ((e.cause ?? e).code === '23505') return res.status(409).json({ detail: 'CPF já cadastrado' });
    throw e;
  }
}));

app.post('/api/atendimentos', rota(async (req, res) => {
  const { id_paciente, status = 'Em espera' } = req.body || {};
  if (!Number.isInteger(id_paciente)) return res.status(422).json({ detail: 'id_paciente inválido' });
  if (typeof status !== 'string' || status.length > 30) return res.status(422).json({ detail: 'Status inválido' });

  const [existe] = await db.select({ id: paciente.id_paciente }).from(paciente)
    .where(eq(paciente.id_paciente, id_paciente));
  if (!existe) return res.status(404).json({ detail: 'Paciente não existe' });

  const [novo] = await db.insert(atendimento).values({ id_paciente, status }).returning();
  res.status(201).json({ id_atendimento: novo.id_atendimento, id_paciente, status });
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
