"""
API de teste SEM banco de dados.
Mesmas rotas e respostas do main.py, mas os dados ficam na memória.
Ao reiniciar a API, tudo volta aos dados iniciais.

Rodar:  python -m uvicorn main_mock:app --reload
"""

from datetime import date, datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="API Pronto Socorro (MOCK)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Modelos ----------

class PacienteIn(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    cpf: str = Field(pattern=r"^\d{11}$")
    data_nascimento: date
    genero: str | None = Field(default=None, max_length=20)
    telefone: str | None = Field(default=None, max_length=15)


class AtendimentoIn(BaseModel):
    id_paciente: int
    status: str = Field(default="Em espera", max_length=30)


# ---------- "Banco" em memória ----------

pacientes = [
    {"id_paciente": 1, "nome": "Maria da Silva", "cpf": "12345678900",
     "data_nascimento": "1990-03-14", "genero": "Feminino", "telefone": "(11) 98765-4321"},
    {"id_paciente": 2, "nome": "João Pereira", "cpf": "98765432100",
     "data_nascimento": "1987-09-02", "genero": "Masculino", "telefone": "(19) 99123-4567"},
    {"id_paciente": 3, "nome": "Ana Souza", "cpf": "45678912300",
     "data_nascimento": "2002-11-30", "genero": None, "telefone": None},
]

atendimentos = [
    {"id_atendimento": 1, "id_paciente": 1, "data_hora_chegada": datetime(2026, 10, 14, 8, 0), "status": "Em espera"},
    {"id_atendimento": 2, "id_paciente": 2, "data_hora_chegada": datetime(2026, 10, 14, 9, 30), "status": "Em atendimento"},
]

proximo_id_paciente = 4
proximo_id_atendimento = 3


def status_atual(id_paciente: int):
    do_paciente = [a for a in atendimentos if a["id_paciente"] == id_paciente]
    if not do_paciente:
        return None
    return max(do_paciente, key=lambda a: a["data_hora_chegada"])["status"]


# ---------- Rotas ----------

@app.get("/pacientes/{cpf}")
def buscar_paciente(cpf: str):
    paciente = next((p for p in pacientes if p["cpf"] == cpf), None)
    if paciente is None:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return {**paciente, "status": status_atual(paciente["id_paciente"])}


@app.post("/pacientes", status_code=201)
def cadastrar_paciente(p: PacienteIn):
    global proximo_id_paciente
    if any(x["cpf"] == p.cpf for x in pacientes):
        raise HTTPException(status_code=409, detail="CPF já cadastrado")

    novo = {"id_paciente": proximo_id_paciente, **p.model_dump()}
    novo["data_nascimento"] = p.data_nascimento.isoformat()
    pacientes.append(novo)
    proximo_id_paciente += 1
    return novo


@app.post("/atendimentos", status_code=201)
def abrir_atendimento(a: AtendimentoIn):
    global proximo_id_atendimento
    if not any(p["id_paciente"] == a.id_paciente for p in pacientes):
        raise HTTPException(status_code=404, detail="Paciente não existe")

    novo = {
        "id_atendimento": proximo_id_atendimento,
        "id_paciente": a.id_paciente,
        "data_hora_chegada": datetime.now(),
        "status": a.status,
    }
    atendimentos.append(novo)
    proximo_id_atendimento += 1
    return {"id_atendimento": novo["id_atendimento"], **a.model_dump()}
