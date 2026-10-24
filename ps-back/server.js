require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'ps-front'))); // serve o front

// ---------- Util ----------

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

const COLUNAS_PACIENTE = `id_paciente, nome, cpf, to_char(data_nascimento, 'YYYY-MM-DD') AS data_nascimento, genero, telefone`;

// ---------- Rotas ----------

// Operação de teste: confirma a conexão lendo a tabela paciente
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM paciente');
    res.json({ banco: 'ok', pacientes: rows[0].total });
  } catch (err) {
    res.status(500).json({ banco: 'erro', detail: err.message });
  }
});

app.get('/api/pacientes', async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT ${COLUNAS_PACIENTE} FROM paciente ORDER BY id_paciente`);
    res.json(rows);
  } catch (err) { next(err); }
});

app.get('/api/pacientes/:cpf', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ${COLUNAS_PACIENTE},
              (SELECT a.status FROM atendimento a
                WHERE a.id_paciente = p.id_paciente
                ORDER BY a.data_hora_chegada DESC LIMIT 1) AS status
         FROM paciente p WHERE p.cpf = $1`,
      [req.params.cpf],
    );
    if (rows.length === 0) return res.status(404).json({ detail: 'Paciente não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.post('/api/pacientes', async (req, res, next) => {
  const body = req.body || {};
  const erro = validarPaciente(body);
  if (erro) return res.status(422).json({ detail: erro });

  try {
    const { rows } = await db.query(
      `INSERT INTO paciente (nome, cpf, data_nascimento, genero, telefone)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS_PACIENTE}`,
      [body.nome, body.cpf, body.data_nascimento, body.genero ?? null, body.telefone ?? null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ detail: 'CPF já cadastrado' });
    next(err);
  }
});

app.post('/api/atendimentos', async (req, res, next) => {
  const { id_paciente, status = 'Em espera' } = req.body || {};
  if (!Number.isInteger(id_paciente)) return res.status(422).json({ detail: 'id_paciente inválido' });
  if (typeof status !== 'string' || status.length > 30) return res.status(422).json({ detail: 'Status inválido' });

  try {
    const { rows } = await db.query(
      `INSERT INTO atendimento (id_paciente, status) VALUES ($1, $2)
       RETURNING id_atendimento, id_paciente, status`,
      [id_paciente, status],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ detail: 'Paciente não existe' });
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: 'Erro interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
