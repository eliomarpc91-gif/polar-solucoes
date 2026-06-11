"""
Polar Soluções - Backend FastAPI
ERP completo para refrigeração, climatização e serviços técnicos
"""
from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Polar Soluções API", version="1.0.0")
api = APIRouter(prefix="/api")


# ============================================================
# MODELS
# ============================================================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Cliente(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    telefone: str = ""
    email: str = ""
    cpfCnpj: str = ""
    endereco: str = ""
    numero: str = ""
    cidade: str = ""
    estado: str = ""
    bairro: str = ""
    cep: str = ""
    observacoes: str = ""
    criadoEm: str = Field(default_factory=now_iso)


class InfoTecnicaEquipamento(BaseModel):
    tipoGas: Optional[str] = None
    qtdGas: Optional[str] = None
    tensao: Optional[str] = None
    corrente: Optional[str] = None
    potencia: Optional[str] = None
    compressor: Optional[str] = None
    obsTecnicas: Optional[str] = None


class Equipamento(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigoInterno: Optional[str] = None
    nome: Optional[str] = None
    clienteId: str
    tipo: str = ""
    marca: str = ""
    modelo: str = ""
    serie: str = ""
    localInstalacao: Optional[str] = None
    statusOperacional: Optional[str] = None  # ativo, manutencao, inativo
    infoTecnica: Optional[InfoTecnicaEquipamento] = None
    fotos: Optional[List[str]] = None
    observacoes: str = ""
    qrData: Optional[str] = None
    criadoEm: Optional[str] = None


class Produto(BaseModel):
    """Produto do estoque/almoxarifado."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    categoria: str = ""
    codigo: str = ""
    fornecedor: str = ""
    quantidade: float = 0
    estoque_minimo: float = 0
    preco_compra: float = 0
    frete: float = 0
    impostos: float = 0
    lucro_percentual: float = 0
    custo_real: float = 0
    preco_venda: float = 0
    observacoes: str = ""
    criadoEm: str = Field(default_factory=now_iso)
    atualizadoEm: str = Field(default_factory=now_iso)


class MovimentacaoEstoque(BaseModel):
    """Movimentação de estoque (entrada/saída/ajuste)."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    produtoId: str
    tipo: Literal["entrada", "saida", "ajuste"]
    quantidade: float
    motivo: str = ""
    referenciaId: Optional[str] = None
    criadoEm: str = Field(default_factory=now_iso)


class ServicoItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    descricao: str
    valor: float
    quantidade: float = 1


class MaterialItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    descricao: str
    quantidade: float = 1
    unidade: str = "un"
    valorUnitario: float
    lucroPercent: float = 0
    frete: float = 0
    produtoId: Optional[str] = None
    custoReal: Optional[float] = None


class GastosOperacionais(BaseModel):
    transporte: float = 0
    alimentacao: float = 0
    hospedagem: float = 0
    outros: float = 0
    descricaoOutros: str = ""


class OrdemServico(BaseModel):
    model_config = {"extra": "allow"}  # aceita campos adicionais sem rejeitar
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero: int = 0
    codigo: Optional[str] = None
    clienteId: str
    clienteNome: str = ""
    equipamentoId: Optional[str] = None
    equipamentoDesc: Optional[str] = None
    equipamentos: List[Dict[str, Any]] = []
    # Campos detalhados do equipamento (preenchidos diretamente na OS)
    equipamento: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serie: Optional[str] = None
    local: Optional[str] = None
    # Campos técnicos
    problema: str = ""
    defeitosEncontrados: Optional[str] = None
    diagnostico: str = ""
    observacaoTecnica: Optional[str] = None
    servicos: List[ServicoItem] = []
    materiais: List[MaterialItem] = []
    observacoes: str = ""
    observacoesInternas: str = ""
    status: Literal["aberto", "em_andamento", "concluido", "pendente", "concluida", "cancelada", "agendada"] = "aberto"
    valorTotal: float = 0
    valorDesconto: float = 0
    formaPagamento: str = ""
    tecnicoResponsavel: str = ""
    tipoServico: Optional[str] = None
    categoria: Optional[str] = None
    dataAbertura: Optional[str] = None
    dataAgendada: Optional[str] = None
    dataConclusao: Optional[str] = None
    dataAtualizacao: Optional[str] = None
    criadoEm: str = Field(default_factory=now_iso)
    atualizadoEm: str = Field(default_factory=now_iso)
    concluidoEm: Optional[str] = None
    statusPagamento: Literal["pendente", "pago", "parcial"] = "pendente"
    dataPagamento: Optional[str] = None
    valorPago: Optional[float] = None
    cobrancaMaoDeObra: Optional[Dict[str, Any]] = None


class Desconto(BaseModel):
    tipo: Literal["percentual", "fixo"]
    valor: float


class Orcamento(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero: int = 0
    codigo: Optional[str] = None
    clienteId: str
    clienteNome: str = ""
    itens: List[ServicoItem] = []
    materiais: List[MaterialItem] = []
    gastosOperacionais: GastosOperacionais = Field(default_factory=GastosOperacionais)
    desconto: Optional[Desconto] = None
    valorSubtotal: float = 0
    valorDesconto: float = 0
    valorTotal: float = 0
    status: Literal["enviado", "aprovado", "rejeitado", "rascunho"] = "enviado"
    observacoes: str = ""
    tecnicoResponsavel: str = ""
    dataCriacao: Optional[str] = None
    criadoEm: str = Field(default_factory=now_iso)
    statusPagamento: Literal["pendente", "pago", "parcial"] = "pendente"
    dataPagamento: Optional[str] = None
    valorPago: Optional[float] = None
    cobrancaMaoDeObra: Optional[Dict[str, Any]] = None
    incluirServicosNoPDF: bool = True
    incluirMateriaisNoPDF: bool = True


class Cobranca(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clienteId: str
    clienteNome: str = ""
    orcamentoId: Optional[str] = None
    codigoOrcamento: Optional[str] = None
    osId: Optional[str] = None
    descricao: str = ""
    valorTotal: float
    valorRecebido: float = 0
    valorPendente: Optional[float] = None
    status: Literal["pendente", "pago", "parcial", "vencido", "cancelado"] = "pendente"
    dataCriacao: str = Field(default_factory=lambda: datetime.now(timezone.utc).date().isoformat())
    dataVencimento: Optional[str] = None
    dataPagamento: Optional[str] = None
    formaPagamento: str = ""


class SaidaFinanceira(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: str
    descricao: str
    categoria: str = "Outros"
    valor: float
    formaPagamento: str = "Dinheiro"
    fornecedor: Optional[str] = None
    criado_em: str = Field(default_factory=now_iso)
    atualizado_em: str = Field(default_factory=now_iso)


class EntradaFinanceira(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: str
    descricao: str
    categoria: str = "Servico"
    valor: float
    formaPagamento: str = "PIX"
    origemTipo: Optional[str] = None  # "cobranca", "manual"
    origemId: Optional[str] = None
    criado_em: str = Field(default_factory=now_iso)


class Evento(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descricao: str = ""
    tipo: Literal["compromisso", "visita", "manutencao", "reuniao", "outro"] = "outro"
    data: str
    hora: str = ""
    clienteId: Optional[str] = None
    clienteNome: Optional[str] = None
    local: Optional[str] = None
    notificacaoEnviada: bool = False
    criadoEm: str = Field(default_factory=now_iso)


class Recibo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cobrancaId: Optional[str] = None
    osId: Optional[str] = None
    clienteId: str
    clienteNome: str = ""
    valor: float
    descricao: str = ""
    metodoPagamento: str = ""
    dataPagamento: str
    criadoEm: str = Field(default_factory=now_iso)


class EmpresaConfig(BaseModel):
    nome: str = "Polar Soluções"
    cnpj: str = ""
    telefone: str = ""
    email: str = ""
    endereco: str = ""
    cidade: str = ""
    estado: str = ""
    logo: str = ""
    tecnicoResponsavel: Optional[str] = None
    assinatura: Optional[str] = None
    metaMensal: Optional[float] = None


# ============================================================
# HELPERS
# ============================================================

PROJ = {"_id": 0}


async def _ensure_indexes():
    await db.clientes.create_index("id", unique=True)
    await db.equipamentos.create_index("id", unique=True)
    await db.ordens.create_index("id", unique=True)
    await db.orcamentos.create_index("id", unique=True)
    await db.cobrancas.create_index("id", unique=True)
    await db.saidas.create_index("id", unique=True)
    await db.entradas.create_index("id", unique=True)
    await db.eventos.create_index("id", unique=True)
    await db.recibos.create_index("id", unique=True)


# ============================================================
# CRUD GENÉRICO
# ============================================================

def make_crud(prefix: str, collection: str, model):
    """Cria endpoints CRUD para uma entidade."""

    @api.get(f"/{prefix}", tags=[prefix])
    async def list_items(limit: int = Query(2000, le=10000)):
        items = await db[collection].find({}, PROJ).limit(limit).to_list(limit)
        return items

    @api.get(f"/{prefix}/{{item_id}}", tags=[prefix])
    async def get_item(item_id: str):
        item = await db[collection].find_one({"id": item_id}, PROJ)
        if not item:
            raise HTTPException(status_code=404, detail=f"{prefix} não encontrado")
        return item

    @api.post(f"/{prefix}", tags=[prefix])
    async def create_item(payload: model):  # type: ignore
        data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
        # upsert por id
        await db[collection].replace_one({"id": data["id"]}, data, upsert=True)
        return data

    @api.put(f"/{prefix}/{{item_id}}", tags=[prefix])
    async def update_item(item_id: str, payload: dict):
        existing = await db[collection].find_one({"id": item_id}, PROJ)
        if not existing:
            raise HTTPException(status_code=404, detail=f"{prefix} não encontrado")
        existing.update(payload)
        existing["id"] = item_id
        if "atualizadoEm" in existing or "atualizado_em" in existing:
            ts = now_iso()
            if "atualizadoEm" in existing:
                existing["atualizadoEm"] = ts
            if "atualizado_em" in existing:
                existing["atualizado_em"] = ts
        await db[collection].replace_one({"id": item_id}, existing, upsert=True)
        return existing

    @api.delete(f"/{prefix}/{{item_id}}", tags=[prefix])
    async def delete_item(item_id: str):
        res = await db[collection].delete_one({"id": item_id})
        return {"deleted": res.deleted_count > 0}


# Cria endpoints CRUD para todas as entidades
make_crud("clientes", "clientes", Cliente)
make_crud("equipamentos", "equipamentos", Equipamento)
make_crud("ordens", "ordens", OrdemServico)
make_crud("orcamentos", "orcamentos", Orcamento)
make_crud("cobrancas", "cobrancas", Cobranca)
make_crud("saidas", "saidas", SaidaFinanceira)
make_crud("entradas", "entradas", EntradaFinanceira)
make_crud("eventos", "eventos", Evento)
make_crud("recibos", "recibos", Recibo)
make_crud("produtos", "produtos", Produto)
make_crud("movimentacoes_estoque", "movimentacoes_estoque", MovimentacaoEstoque)


# ============================================================
# CARTEIRAS FINANCEIRAS
# ============================================================
class Carteira(BaseModel):
    id: str
    nome: str
    percentual: float = 0
    saldo: float = 0
    cor: str = "#1E88E5"
    ativa: bool = True
    saldoMinimo: Optional[float] = None
    criadoEm: str = Field(default_factory=now_iso)
    atualizadoEm: str = Field(default_factory=now_iso)


class MovimentacaoCarteira(BaseModel):
    id: str
    carteiraId: str
    tipo: str  # entrada, saida, transferencia_entrada, transferencia_saida, ajuste
    valor: float
    data: str = Field(default_factory=now_iso)
    descricao: str = ""
    origemId: Optional[str] = None
    contraparteCarteiraId: Optional[str] = None
    saldoApos: float = 0


make_crud("carteiras", "carteiras", Carteira)
make_crud("mov_carteiras", "mov_carteiras", MovimentacaoCarteira)


class ServicoCadastrado(BaseModel):
    id: str
    nome: str
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    tempoEstimado: Optional[str] = None
    valorBase: float = 0
    ativo: bool = True
    criadoEm: str = Field(default_factory=now_iso)
    atualizadoEm: str = Field(default_factory=now_iso)


make_crud("servicos_cadastrados", "servicos_cadastrados", ServicoCadastrado)


# ============================================================
# EMPRESA (configuração singleton)
# ============================================================

@api.get("/empresa", tags=["empresa"])
async def get_empresa():
    cfg = await db.empresa.find_one({"_id": "config"})
    if not cfg:
        cfg = EmpresaConfig().model_dump()
        cfg["_id"] = "config"
        await db.empresa.insert_one(cfg)
    cfg.pop("_id", None)
    return cfg


@api.put("/empresa", tags=["empresa"])
async def update_empresa(payload: dict):
    payload["_id"] = "config"
    await db.empresa.replace_one({"_id": "config"}, payload, upsert=True)
    payload.pop("_id", None)
    return payload


# ============================================================
# SYNC BULK (push offline)
# ============================================================

@api.post("/sync/push", tags=["sync"])
async def sync_push(payload: Dict[str, Any]):
    """Recebe coleções inteiras do mobile (offline-first) e faz upsert por id."""
    mapping = {
        "clientes": "clientes",
        "equipamentos": "equipamentos",
        "ordens": "ordens",
        "orcamentos": "orcamentos",
        "cobrancas": "cobrancas",
        "saidas": "saidas",
        "entradas": "entradas",
        "eventos": "eventos",
        "recibos": "recibos",
        "produtos": "produtos",
        "movimentacoes_estoque": "movimentacoes_estoque",
    }
    result = {}
    for key, col in mapping.items():
        items = payload.get(key) or []
        if not isinstance(items, list):
            items = []
        n = 0
        for it in items:
            if not isinstance(it, dict) or not it.get("id"):
                continue
            try:
                await db[col].replace_one({"id": it["id"]}, it, upsert=True)
                n += 1
            except Exception as e:
                # Ignora itens individuais com erro pra não derrubar o sync inteiro
                logger.warning(f"sync push ignorou item {key}/{it.get('id')}: {e}")
        result[key] = n
    if "empresa" in payload and payload["empresa"]:
        emp = payload["empresa"] if isinstance(payload["empresa"], dict) else payload["empresa"][0]
        if isinstance(emp, dict):
            emp["_id"] = "config"
            await db.empresa.replace_one({"_id": "config"}, emp, upsert=True)
            result["empresa"] = 1
    return {"upserted": result, "ts": now_iso()}


@api.get("/sync/pull", tags=["sync"])
async def sync_pull():
    """Devolve todas as coleções para o mobile sincronizar."""
    cols = ["clientes", "equipamentos", "ordens", "orcamentos", "cobrancas",
            "saidas", "entradas", "eventos", "recibos", "produtos", "movimentacoes_estoque"]
    out: Dict[str, Any] = {}
    for c in cols:
        out[c] = await db[c].find({}, PROJ).to_list(10000)
    emp = await db.empresa.find_one({"_id": "config"})
    if emp:
        emp.pop("_id", None)
    out["empresa"] = emp or {}
    out["ts"] = now_iso()
    return out


# ============================================================
# DASHBOARD / RELATÓRIOS
# ============================================================

@api.get("/dashboard", tags=["dashboard"])
async def dashboard():
    """Métricas consolidadas para o painel."""
    cobs = await db.cobrancas.find({}, PROJ).to_list(10000)
    orcs = await db.orcamentos.find({}, PROJ).to_list(10000)
    oss = await db.ordens.find({}, PROJ).to_list(10000)
    cls = await db.clientes.find({}, PROJ).to_list(10000)
    saidas = await db.saidas.find({}, PROJ).to_list(10000)

    hoje = datetime.now(timezone.utc).date().isoformat()
    inicio_mes = hoje[:7] + "-01"

    faturamento_mes = sum(
        c.get("valorTotal", 0)
        for c in cobs
        if c.get("status") == "pago" and (c.get("dataPagamento") or "") >= inicio_mes
    )
    saidas_mes = sum(s.get("valor", 0) for s in saidas if (s.get("data") or "") >= inicio_mes)
    lucro_mes = faturamento_mes - saidas_mes

    # Normaliza status (case + acento) para comparar
    def _norm(s):
        return (s or "").lower().replace("í", "i").replace("ó", "o").strip().replace(" ", "_")
    os_abertas = sum(1 for o in oss if _norm(o.get("status")) not in {"concluido", "concluida", "cancelada", "cancelado"})
    os_concluidas = sum(1 for o in oss if o.get("status") in ["concluido", "concluida"])

    cobrancas_pendentes = sum(1 for c in cobs if c.get("status") in ["pendente", "vencido", "parcial"])
    orcamentos_abertos = sum(1 for o in orcs if o.get("status") in ["enviado", "rascunho"])

    return {
        "faturamentoMes": faturamento_mes,
        "saidasMes": saidas_mes,
        "lucroMes": lucro_mes,
        "osAbertas": os_abertas,
        "osConcluidas": os_concluidas,
        "clientesAtivos": len(cls),
        "cobrancasPendentes": cobrancas_pendentes,
        "orcamentosAbertos": orcamentos_abertos,
        "ts": now_iso(),
    }


# ============================================================
# IA - ANÁLISE DE NEGÓCIO (Claude Sonnet via Emergent LLM)
# ============================================================

class AnaliseIAPayload(BaseModel):
    pergunta: Optional[str] = None  # pergunta livre (modo Q&A)
    contexto: Optional[Dict[str, Any]] = None  # contexto extra opcional


def _resumir_dados(cobs, orcs, oss, cls, saidas, eventos, recibos) -> Dict[str, Any]:
    """Cria um resumo executivo dos dados (limita custo do LLM)."""
    hoje = datetime.now(timezone.utc).date().isoformat()
    inicio_mes = hoje[:7] + "-01"
    inicio_ano = hoje[:4] + "-01-01"

    # KPIs financeiros
    fat_mes = sum(c.get("valorTotal", 0) for c in cobs if c.get("status") == "pago" and (c.get("dataPagamento") or "") >= inicio_mes)
    fat_ano = sum(c.get("valorTotal", 0) for c in cobs if c.get("status") == "pago" and (c.get("dataPagamento") or "") >= inicio_ano)
    saidas_mes = sum(s.get("valor", 0) for s in saidas if (s.get("data") or "") >= inicio_mes)
    a_receber = sum(c.get("valorTotal", 0) for c in cobs if c.get("status") in ["pendente", "parcial", "vencido"])
    vencidas = [c for c in cobs if c.get("status") == "vencido" or (c.get("dataVencimento") and c.get("dataVencimento") < hoje and c.get("status") != "pago")]

    # Ticket médio
    pagas = [c for c in cobs if c.get("status") == "pago"]
    ticket = (sum(c.get("valorTotal", 0) for c in pagas) / len(pagas)) if pagas else 0

    # Categorias de serviço mais frequentes
    cat_count: Dict[str, int] = {}
    for o in oss:
        k = o.get("tipoServico") or o.get("categoria") or "Manutenção"
        cat_count[k] = cat_count.get(k, 0) + 1
    top_cats = sorted(cat_count.items(), key=lambda x: -x[1])[:5]

    # Clientes top
    cli_total: Dict[str, float] = {}
    for c in pagas:
        nome = c.get("clienteNome") or "—"
        cli_total[nome] = cli_total.get(nome, 0) + c.get("valorTotal", 0)
    top_cli = sorted(cli_total.items(), key=lambda x: -x[1])[:5]

    # Inadimplentes (clientes com cobrança vencida)
    inad: Dict[str, float] = {}
    for c in vencidas:
        nome = c.get("clienteNome") or "—"
        inad[nome] = inad.get(nome, 0) + c.get("valorTotal", 0)
    top_inad = sorted(inad.items(), key=lambda x: -x[1])[:5]

    # Status orçamentos
    orc_status: Dict[str, int] = {}
    for o in orcs:
        orc_status[o.get("status", "—")] = orc_status.get(o.get("status", "—"), 0) + 1

    # Categorias de saída
    sai_cat: Dict[str, float] = {}
    for s in saidas:
        k = s.get("categoria") or "Outros"
        sai_cat[k] = sai_cat.get(k, 0) + s.get("valor", 0)
    top_sai = sorted(sai_cat.items(), key=lambda x: -x[1])[:5]

    return {
        "dataReferencia": hoje,
        "kpis": {
            "faturamentoMes": round(fat_mes, 2),
            "faturamentoAno": round(fat_ano, 2),
            "saidasMes": round(saidas_mes, 2),
            "lucroMes": round(fat_mes - saidas_mes, 2),
            "aReceber": round(a_receber, 2),
            "vencidas": round(sum(c.get("valorTotal", 0) for c in vencidas), 2),
            "ticketMedio": round(ticket, 2),
            "qtdClientes": len(cls),
            "qtdOS": len(oss),
            "qtdOSAbertas": sum(1 for o in oss if o.get("status") not in ["concluido", "concluida", "cancelada"]),
            "qtdOSConcluidas": sum(1 for o in oss if o.get("status") in ["concluido", "concluida"]),
            "qtdOrcamentos": len(orcs),
            "qtdRecibos": len(recibos),
            "qtdCobrancasPagas": len(pagas),
            "qtdCobrancasVencidas": len(vencidas),
        },
        "topCategorias": [{"categoria": k, "qtd": v} for k, v in top_cats],
        "topClientes": [{"cliente": k, "totalGasto": round(v, 2)} for k, v in top_cli],
        "topInadimplentes": [{"cliente": k, "valor": round(v, 2)} for k, v in top_inad],
        "orcamentosPorStatus": orc_status,
        "topCategoriasSaida": [{"categoria": k, "valor": round(v, 2)} for k, v in top_sai],
    }


@api.post("/ia/analise", tags=["ia"])
async def ia_analise(payload: AnaliseIAPayload):
    """Gera análise inteligente do negócio usando Claude Sonnet 4.5 via Emergent LLM."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"LLM lib indisponível: {e}")

    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY não configurada")

    cobs = await db.cobrancas.find({}, PROJ).to_list(10000)
    orcs = await db.orcamentos.find({}, PROJ).to_list(10000)
    oss = await db.ordens.find({}, PROJ).to_list(10000)
    cls = await db.clientes.find({}, PROJ).to_list(10000)
    saidas = await db.saidas.find({}, PROJ).to_list(10000)
    eventos = await db.eventos.find({}, PROJ).to_list(10000)
    recibos = await db.recibos.find({}, PROJ).to_list(10000)
    empresa = await db.empresa.find_one({"_id": "config"}) or {}
    empresa.pop("_id", None)

    resumo = _resumir_dados(cobs, orcs, oss, cls, saidas, eventos, recibos)

    nome_empresa = empresa.get("nome") or "a empresa"
    pergunta = (payload.pergunta or "").strip()

    system = (
        f"Você é um consultor de negócios sênior especialista em empresas de refrigeração, "
        f"climatização e serviços técnicos. Você está analisando os dados reais da empresa '{nome_empresa}'. "
        "Responda SEMPRE em português brasileiro, de forma direta, prática e acionável. "
        "Use markdown com títulos curtos (##), listas e negrito para destacar números. "
        "Quando citar valores monetários, use o formato brasileiro (R$ 1.234,56)."
    )

    if pergunta:
        prompt = (
            f"Dados da empresa (resumo executivo em JSON):\n```json\n{resumo}\n```\n\n"
            f"Pergunta do usuário: {pergunta}\n\n"
            "Responda usando os dados acima. Seja específico, cite números reais e dê recomendações."
        )
    else:
        prompt = (
            f"Dados consolidados da empresa (JSON):\n```json\n{resumo}\n```\n\n"
            "Gere uma **Análise Executiva** estruturada com as seções:\n"
            "1. **📊 Resumo financeiro do mês** (faturamento, despesas, lucro, margem)\n"
            "2. **🎯 Pontos fortes** (3 destaques positivos)\n"
            "3. **⚠️ Pontos de atenção** (3 riscos ou problemas identificados)\n"
            "4. **💰 Inadimplência e cobranças** (análise dos vencidos)\n"
            "5. **🛠 Mix de serviços** (categorias que mais geram receita ou volume)\n"
            "6. **👥 Clientes-chave** (top 5 e concentração)\n"
            "7. **🚀 5 Recomendações práticas** (priorizadas e específicas para refrigeração/climatização)\n\n"
            "Use negrito para valores. Seja conciso (no máximo 400 palavras no total)."
        )

    chat = LlmChat(
        api_key=key,
        session_id=f"polar-analise-{uuid.uuid4().hex[:8]}",
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        resposta = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.exception("Erro IA")
        raise HTTPException(status_code=500, detail=f"Erro IA: {e}")

    return {
        "analise": resposta,
        "resumo": resumo,
        "modelo": "claude-sonnet-4-5-20250929",
        "ts": now_iso(),
    }


# ============================================================
# RENTABILIDADE DE SERVIÇOS - Análise de lucro por OS/serviço
# ============================================================

class RentabilidadePayload(BaseModel):
    mes: Optional[str] = None  # formato YYYY-MM (filtro opcional)


def _calcular_rentabilidade(oss: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcula KPIs de rentabilidade a partir das OS."""
    HORA_RATE = 50.0  # custo padrão por hora de mão de obra (R$)
    DESLOCAMENTO_DEFAULT = 30.0  # custo de deslocamento padrão

    servicos_agreg: Dict[str, Dict[str, float]] = {}
    por_mes: Dict[str, Dict[str, float]] = {}
    detalhados: List[Dict[str, Any]] = []

    for o in oss:
        status = (o.get("status") or "").lower()
        if status not in ("concluido", "concluida"):
            continue

        valor = float(o.get("valorTotal") or 0)
        # Custo de materiais: soma dos materiais
        custo_material = 0.0
        for m in (o.get("materiais") or []):
            custo_material += float(m.get("valorUnitario") or 0) * float(m.get("quantidade") or 0)
            custo_material += float(m.get("frete") or 0)
        # Custo de deslocamento
        custo_desloc = float(o.get("custoDeslocamento") or o.get("gastosOperacionais", {}).get("deslocamento", 0) or DESLOCAMENTO_DEFAULT if valor > 0 else 0)
        # Horas trabalhadas
        horas = float(o.get("horasTrabalhadas") or 1)
        custo_mao = float(o.get("custoMaoDeObra") or 0) or (horas * HORA_RATE)
        custo_total = custo_material + custo_desloc + custo_mao
        lucro = valor - custo_total
        margem = (lucro / valor * 100) if valor > 0 else 0
        lucro_por_hora = lucro / horas if horas > 0 else 0
        tipo_servico = o.get("tipoServico") or o.get("categoria") or "Outros"

        detalhados.append({
            "id": o.get("id"),
            "numero": o.get("numero") or o.get("codigo"),
            "cliente": o.get("clienteNome"),
            "servico": tipo_servico,
            "valor": round(valor, 2),
            "custoMaterial": round(custo_material, 2),
            "custoDeslocamento": round(custo_desloc, 2),
            "custoMaoDeObra": round(custo_mao, 2),
            "horasTrabalhadas": horas,
            "lucroLiquido": round(lucro, 2),
            "margemPercentual": round(margem, 2),
            "lucroPorHora": round(lucro_por_hora, 2),
            "dataConclusao": o.get("concluidoEm") or o.get("dataConclusao") or o.get("atualizadoEm"),
        })

        # Agrega por tipo de serviço
        if tipo_servico not in servicos_agreg:
            servicos_agreg[tipo_servico] = {"qtd": 0, "faturamento": 0, "custo": 0, "lucro": 0, "horas": 0}
        servicos_agreg[tipo_servico]["qtd"] += 1
        servicos_agreg[tipo_servico]["faturamento"] += valor
        servicos_agreg[tipo_servico]["custo"] += custo_total
        servicos_agreg[tipo_servico]["lucro"] += lucro
        servicos_agreg[tipo_servico]["horas"] += horas

        # Agrega por mês
        data_str = (o.get("concluidoEm") or o.get("dataConclusao") or o.get("atualizadoEm") or "")[:7]
        if data_str:
            if data_str not in por_mes:
                por_mes[data_str] = {"faturamento": 0, "custo": 0, "lucro": 0, "qtd": 0}
            por_mes[data_str]["faturamento"] += valor
            por_mes[data_str]["custo"] += custo_total
            por_mes[data_str]["lucro"] += lucro
            por_mes[data_str]["qtd"] += 1

    # Rankings
    ranking = sorted(servicos_agreg.items(), key=lambda x: -x[1]["lucro"])
    mais_rentaveis = [{"servico": k, **{kk: round(vv, 2) for kk, vv in v.items()}, "margem": round((v["lucro"] / v["faturamento"] * 100) if v["faturamento"] > 0 else 0, 2)} for k, v in ranking[:5]]
    menos_rentaveis = [{"servico": k, **{kk: round(vv, 2) for kk, vv in v.items()}, "margem": round((v["lucro"] / v["faturamento"] * 100) if v["faturamento"] > 0 else 0, 2)} for k, v in list(reversed(ranking))[:5]]

    # Totais
    total_fat = sum(s["faturamento"] for s in servicos_agreg.values())
    total_custo = sum(s["custo"] for s in servicos_agreg.values())
    total_lucro = total_fat - total_custo
    margem_global = (total_lucro / total_fat * 100) if total_fat > 0 else 0

    # Mês atual vs anterior
    hoje = datetime.now(timezone.utc).date()
    mes_atual = hoje.isoformat()[:7]
    ano, mes_n = int(mes_atual[:4]), int(mes_atual[5:7])
    mes_ant_n = mes_n - 1 if mes_n > 1 else 12
    ano_ant = ano if mes_n > 1 else ano - 1
    mes_anterior = f"{ano_ant:04d}-{mes_ant_n:02d}"

    dados_mes = por_mes.get(mes_atual, {"faturamento": 0, "custo": 0, "lucro": 0, "qtd": 0})
    dados_mes_ant = por_mes.get(mes_anterior, {"faturamento": 0, "custo": 0, "lucro": 0, "qtd": 0})

    # Sugestões de reajuste (serviços com margem < 25%)
    sugestoes = []
    for servico, v in servicos_agreg.items():
        margem = (v["lucro"] / v["faturamento"] * 100) if v["faturamento"] > 0 else 0
        if margem < 25 and v["qtd"] >= 1:
            reajuste = max(15, round(30 - margem))
            sugestoes.append({
                "servico": servico,
                "margemAtual": round(margem, 2),
                "reajusteSugerido": reajuste,
                "novoPreco": round((v["faturamento"] / v["qtd"]) * (1 + reajuste / 100), 2),
                "qtd": v["qtd"],
            })

    # Alertas
    alertas = []
    for servico, v in servicos_agreg.items():
        margem = (v["lucro"] / v["faturamento"] * 100) if v["faturamento"] > 0 else 0
        if margem < 10 and v["qtd"] >= 1:
            alertas.append({"tipo": "critico", "servico": servico, "msg": f"Margem crítica de {margem:.1f}%"})
        elif margem < 25:
            alertas.append({"tipo": "atencao", "servico": servico, "msg": f"Margem baixa de {margem:.1f}%"})

    return {
        "kpis": {
            "faturamentoTotal": round(total_fat, 2),
            "custoTotal": round(total_custo, 2),
            "lucroTotal": round(total_lucro, 2),
            "margemGlobal": round(margem_global, 2),
            "qtdOSConcluidas": sum(s["qtd"] for s in servicos_agreg.values()),
            "ticketMedio": round(total_fat / sum(s["qtd"] for s in servicos_agreg.values()), 2) if servicos_agreg else 0,
        },
        "mes": {
            "atual": {"ref": mes_atual, **{k: round(v, 2) for k, v in dados_mes.items()}},
            "anterior": {"ref": mes_anterior, **{k: round(v, 2) for k, v in dados_mes_ant.items()}},
            "crescimentoFat": round(((dados_mes["faturamento"] - dados_mes_ant["faturamento"]) / dados_mes_ant["faturamento"] * 100) if dados_mes_ant["faturamento"] > 0 else 0, 2),
            "crescimentoLucro": round(((dados_mes["lucro"] - dados_mes_ant["lucro"]) / dados_mes_ant["lucro"] * 100) if dados_mes_ant["lucro"] > 0 else 0, 2),
        },
        "rankingMaisRentaveis": mais_rentaveis,
        "rankingMenosRentaveis": menos_rentaveis,
        "evolucaoMensal": [{"mes": k, **{kk: round(vv, 2) for kk, vv in v.items()}} for k, v in sorted(por_mes.items())[-6:]],
        "sugestoesReajuste": sugestoes[:5],
        "alertas": alertas[:10],
        "detalhados": detalhados[:50],
    }


@api.post("/rentabilidade/analise", tags=["rentabilidade"])
async def rentabilidade_analise(payload: RentabilidadePayload = None):
    """Calcula rentabilidade detalhada por serviço + insights via Claude."""
    oss = await db.ordens.find({}, PROJ).to_list(10000)
    resultado = _calcular_rentabilidade(oss)

    # Anexa insights de IA (não bloqueante)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
        key = os.environ.get("EMERGENT_LLM_KEY")
        if key and resultado["kpis"]["qtdOSConcluidas"] > 0:
            chat = LlmChat(
                api_key=key,
                session_id=f"polar-rentab-{uuid.uuid4().hex[:8]}",
                system_message="Você é um consultor financeiro especialista em empresas de refrigeração e climatização. Responda em português brasileiro, conciso (máximo 250 palavras), usando markdown e valores em R$ no formato brasileiro.",
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            prompt = (
                f"Dados de rentabilidade da empresa:\n```json\n{resultado}\n```\n\n"
                "Gere uma análise executiva com:\n"
                "1. **🏆 Serviço estrela** (mais rentável)\n"
                "2. **⚠️ Serviço problemático** (menos rentável + por quê)\n"
                "3. **💰 Oportunidade de reajuste** (qual subir e em quanto)\n"
                "4. **📊 Análise do mês** (vs mês anterior)\n"
                "5. **🎯 Recomendação principal** (1 ação prioritária)\n"
            )
            insight = await chat.send_message(UserMessage(text=prompt))
            resultado["insightIA"] = insight
            resultado["modelo"] = "claude-sonnet-4-5-20250929"
    except Exception as e:
        logger.warning(f"IA rentabilidade falhou: {e}")
        resultado["insightIA"] = None

    return resultado


# ============================================================
# APP SETUP
# ============================================================

app.include_router(api)

# ============================================================
# WEB ADMIN (SPA) - servido em /api/admin/*
# ============================================================

WEB_DIST = Path("/app/web/dist")
if WEB_DIST.exists():
    # Servir os assets estáticos do build (CSS/JS) sob /api/admin/assets/*
    if (WEB_DIST / "assets").exists():
        app.mount(
            "/api/admin/assets",
            StaticFiles(directory=str(WEB_DIST / "assets")),
            name="admin-assets",
        )

    @app.get("/api/admin")
    @app.get("/api/admin/")
    async def admin_root():
        return FileResponse(WEB_DIST / "index.html")

    # SPA fallback - qualquer rota /api/admin/* devolve index.html
    @app.get("/api/admin/{full_path:path}")
    async def admin_spa(full_path: str):
        candidate = WEB_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(WEB_DIST / "index.html")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Polar Soluções API configurado")


@app.on_event("startup")
async def startup():
    await _ensure_indexes()
    logger.info("Polar Soluções API iniciado")


@app.on_event("shutdown")
async def shutdown():
    client.close()
