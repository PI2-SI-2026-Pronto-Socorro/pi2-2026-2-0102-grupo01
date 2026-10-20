import os
from contextlib import asynccontextmanager
from datetime import date

import oracledb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

pool = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = oracledb.create_pool(
        user=os.getenv("ORACLE_USER"),
        password=os.getenv("ORACLE_PASSWORD"),
        dsn=os.getenv("ORACLE_DSN"),
        config_dir=os.getenv("ORACLE_WALLET_DIR"),
        wallet_location=os.getenv("ORACLE_WALLET_DIR"),
        wallet_password=os.getenv("ORACLE_WALLET_PASSWORD"),
        min=1,
        max=4,
    )
    yield
    pool.close()


app = FastAPI(title="API Pronto Socorro", lifespan=lifespan)

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


# ---------- Util ----------

def linhas_como_dict(cursor):
    colunas = [c[0].lower() for c in cursor.description]
    cursor.rowfactory = lambda *valores: dict(zip(colunas, valores))


# ---------- Rotas ----------

@app.get("/pacientes")
def listar_pacientes():
    """Operação de teste: lê a tabela paciente inteira."""
    sql = """
        SELECT id_paciente, nome, cpf, data_nascimento, genero, telefone
          FROM paciente
         ORDER BY id_paciente
    """
    with pool.acquire() as con:
        with con.cursor() as cur:
            cur.execute(sql)
            linhas_como_dict(cur)
            pacientes = cur.fetchall()

    for p in pacientes:
        p["data_nascimento"] = p["data_nascimento"].date().isoformat()
    return pacientes


@app.get("/pacientes/{cpf}")
def buscar_paciente(cpf: str):
    sql = """
        SELECT p.id_paciente, p.nome, p.cpf, p.data_nascimento, p.genero, p.telefone,
               (SELECT a.status
                  FROM atendimento a
                 WHERE a.id_paciente = p.id_paciente
                 ORDER BY a.data_hora_chegada DESC
                 FETCH FIRST 1 ROWS ONLY) AS status
          FROM paciente p
         WHERE p.cpf = :cpf
    """
    with pool.acquire() as con:
        with con.cursor() as cur:
            cur.execute(sql, cpf=cpf)
            linhas_como_dict(cur)
            paciente = cur.fetchone()

    if paciente is None:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    paciente["data_nascimento"] = paciente["data_nascimento"].date().isoformat()
    return paciente


@app.post("/pacientes", status_code=201)
def cadastrar_paciente(p: PacienteIn):
    sql = """
        INSERT INTO paciente (nome, cpf, data_nascimento, genero, telefone)
        VALUES (:nome, :cpf, :data_nascimento, :genero, :telefone)
        RETURNING id_paciente INTO :id_paciente
    """
    with pool.acquire() as con:
        with con.cursor() as cur:
            id_var = cur.var(int)
            try:
                cur.execute(sql, **p.model_dump(), id_paciente=id_var)
            except oracledb.IntegrityError:
                raise HTTPException(status_code=409, detail="CPF já cadastrado")
            con.commit()

    return {"id_paciente": id_var.getvalue()[0], **p.model_dump()}


@app.post("/atendimentos", status_code=201)
def abrir_atendimento(a: AtendimentoIn):
    sql = """
        INSERT INTO atendimento (id_paciente, status)
        VALUES (:id_paciente, :status)
        RETURNING id_atendimento INTO :id_atendimento
    """
    with pool.acquire() as con:
        with con.cursor() as cur:
            id_var = cur.var(int)
            try:
                cur.execute(sql, id_paciente=a.id_paciente, status=a.status, id_atendimento=id_var)
            except oracledb.IntegrityError:
                raise HTTPException(status_code=404, detail="Paciente não existe")
            con.commit()

    return {"id_atendimento": id_var.getvalue()[0], **a.model_dump()}
