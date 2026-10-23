const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'ps-front'))); // serve o front

// ---------- "Banco" em memória ----------
// Ao reiniciar o servidor, tudo volta aos dados iniciais.

const pacientes = [
  { id_paciente: 1, nome: 'Maria da Silva', cpf: '12345678900',
    data_nascimento: '1990-03-14', genero: 'Feminino', telefone: '(11) 98765-4321' },
  { id_paciente: 2, nome: 'João Pereira', cpf: '98765432100',
    data_nascimento: '1987-09-02', genero: 'Masculino', telefone: '(19) 99123-4567' },
  { id_paciente: 3, nome: 'Ana Souza', cpf: '45678912300',
    data_nascimento: '2002-11-30', genero: null, telefone: null },
];

const atendimentos = [
  { id_atendimento: 1, id_paciente: 1, data_hora_chegada: new Date('2026-10-14T08:00:00'), status: 'Em espera' },
  { id_atendimento: 2, id_paciente: 2, data_hora_chegada: new Date('2026-10-14T09:30:00'), status: 'Em atendimento' },
];

let proximoIdPaciente = 4;
let proximoIdAtendimento = 3;

// ---------- Util ----------

function statusAtual(idPaciente) {
  const doPaciente = atendimentos.filter((a) => a.id_paciente === idPaciente);
  if (doPaciente.length === 0) return null;
  doPaciente.sort((a, b) => b.data_hora_chegada - a.data_hora_chegada);
  return doPaciente[0].status;
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

// ---------- Rotas ----------

app.get('/api/pacientes', (req, res) => res.json(pacientes));

app.get('/api/pacientes/:cpf', (req, res) => {
  const paciente = pacientes.find((p) => p.cpf === req.params.cpf);
  if (!paciente) return res.status(404).json({ detail: 'Paciente não encontrado' });
  res.json({ ...paciente, status: statusAtual(paciente.id_paciente) });
});

app.post('/api/pacientes', (req, res) => {
  const body = req.body || {};
  const erro = validarPaciente(body);
  if (erro) return res.status(422).json({ detail: erro });
  if (pacientes.some((p) => p.cpf === body.cpf)) {
    return res.status(409).json({ detail: 'CPF já cadastrado' });
  }

  const novo = {
    id_paciente: proximoIdPaciente++,
    nome: body.nome,
    cpf: body.cpf,
    data_nascimento: body.data_nascimento,
    genero: body.genero ?? null,
    telefone: body.telefone ?? null,
  };
  pacientes.push(novo);
  res.status(201).json(novo);
});

app.post('/api/atendimentos', (req, res) => {
  const { id_paciente, status = 'Em espera' } = req.body || {};
  if (!Number.isInteger(id_paciente)) return res.status(422).json({ detail: 'id_paciente inválido' });
  if (typeof status !== 'string' || status.length > 30) return res.status(422).json({ detail: 'Status inválido' });
  if (!pacientes.some((p) => p.id_paciente === id_paciente)) {
    return res.status(404).json({ detail: 'Paciente não existe' });
  }

  const novo = { id_atendimento: proximoIdAtendimento++, id_paciente, data_hora_chegada: new Date(), status };
  atendimentos.push(novo);
  res.status(201).json({ id_atendimento: novo.id_atendimento, id_paciente, status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
