"""
Polar Soluções - Backend API regression + new feature tests.
Covers: CRUD básico, dashboard, sync push/pull, empresa (logo),
recibos CRUD, orçamentos com itens detalhados e IA /ia/analise.
"""
import os
import uuid
import pytest
import requests

BASE_URL = "https://code-zip-uploader.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Root / dashboard ----------
class TestBasics:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        d = r.json()
        assert d.get("app") == "Polar Soluções API"

    def test_dashboard(self, s):
        r = s.get(f"{API}/dashboard")
        assert r.status_code == 200
        d = r.json()
        for k in [
            "faturamentoMes", "saidasMes", "lucroMes",
            "osAbertas", "osConcluidas", "clientesAtivos",
            "cobrancasPendentes", "orcamentosAbertos",
        ]:
            assert k in d, f"missing key {k}"

    def test_admin_spa_served(self, s):
        r = s.get(f"{BASE_URL}/api/admin/", allow_redirects=True)
        assert r.status_code == 200
        # index.html should contain root div
        assert "<div id=\"root\"" in r.text or "<div id='root'" in r.text


# ---------- Empresa (logo base64) ----------
class TestEmpresa:
    def test_get_then_put_logo(self, s):
        r = s.get(f"{API}/empresa")
        assert r.status_code == 200
        cfg = r.json()
        assert isinstance(cfg, dict)
        # fake base64 logo
        cfg["nome"] = cfg.get("nome") or "Polar Soluções"
        cfg["logo"] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        r2 = s.put(f"{API}/empresa", json=cfg)
        assert r2.status_code == 200
        # GET again - logo persisted
        r3 = s.get(f"{API}/empresa")
        assert r3.status_code == 200
        assert r3.json().get("logo", "").startswith("data:image/png;base64,")


# ---------- Recibos CRUD ----------
class TestRecibos:
    recibo_id = None

    def test_create_recibo(self, s):
        payload = {
            "clienteId": "cli-test-" + uuid.uuid4().hex[:6],
            "clienteNome": "TEST_Cliente",
            "valor": 250.50,
            "descricao": "TEST_Recibo manutenção ar-condicionado",
            "metodoPagamento": "PIX",
            "dataPagamento": "2026-01-15",
        }
        r = s.post(f"{API}/recibos", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["valor"] == 250.50
        assert d["clienteNome"] == "TEST_Cliente"
        assert "id" in d
        TestRecibos.recibo_id = d["id"]

    def test_list_recibos(self, s):
        r = s.get(f"{API}/recibos")
        assert r.status_code == 200
        lst = r.json()
        assert isinstance(lst, list)
        assert any(x.get("id") == TestRecibos.recibo_id for x in lst)

    def test_get_recibo(self, s):
        r = s.get(f"{API}/recibos/{TestRecibos.recibo_id}")
        assert r.status_code == 200
        assert r.json()["valor"] == 250.50

    def test_delete_recibo(self, s):
        r = s.delete(f"{API}/recibos/{TestRecibos.recibo_id}")
        assert r.status_code == 200
        assert r.json().get("deleted") is True
        r2 = s.get(f"{API}/recibos/{TestRecibos.recibo_id}")
        assert r2.status_code == 404


# ---------- Orçamentos com itens detalhados ----------
class TestOrcamentos:
    orc_id = None

    def test_create_orcamento_com_itens(self, s):
        payload = {
            "clienteId": "cli-orc-" + uuid.uuid4().hex[:6],
            "clienteNome": "TEST_Cliente Orc",
            "itens": [
                {"descricao": "Instalação split 12000 BTUs", "valor": 350.00, "quantidade": 2},
                {"descricao": "Limpeza preventiva", "valor": 120.00, "quantidade": 1},
            ],
            "materiais": [
                {"descricao": "Tubulação cobre 1/4", "quantidade": 5, "unidade": "m", "valorUnitario": 25.00},
                {"descricao": "Suporte parede", "quantidade": 2, "unidade": "un", "valorUnitario": 45.00},
            ],
            "valorSubtotal": 1035.0,
            "valorDesconto": 0,
            "valorTotal": 1035.0,
            "status": "enviado",
            "observacoes": "TEST orçamento detalhado",
        }
        r = s.post(f"{API}/orcamentos", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert len(d["itens"]) == 2
        assert len(d["materiais"]) == 2
        assert d["itens"][0]["quantidade"] == 2
        assert d["materiais"][0]["valorUnitario"] == 25.0
        TestOrcamentos.orc_id = d["id"]

    def test_get_orcamento(self, s):
        r = s.get(f"{API}/orcamentos/{TestOrcamentos.orc_id}")
        assert r.status_code == 200
        d = r.json()
        assert d["valorTotal"] == 1035.0
        assert d["itens"][0]["descricao"].startswith("Instalação")

    def test_delete_orcamento_cleanup(self, s):
        r = s.delete(f"{API}/orcamentos/{TestOrcamentos.orc_id}")
        assert r.status_code == 200


# ---------- Sync push/pull ----------
class TestSync:
    cli_id = "TEST_sync_" + uuid.uuid4().hex[:8]

    def test_sync_push(self, s):
        payload = {
            "clientes": [
                {"id": TestSync.cli_id, "nome": "TEST_Sync Cliente", "telefone": "11999999999"}
            ]
        }
        r = s.post(f"{API}/sync/push", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d.get("upserted", {}).get("clientes") == 1

    def test_sync_pull_has_data(self, s):
        r = s.get(f"{API}/sync/pull")
        assert r.status_code == 200
        d = r.json()
        for col in ["clientes", "equipamentos", "ordens", "orcamentos",
                    "cobrancas", "saidas", "entradas", "eventos", "recibos"]:
            assert col in d, f"sync/pull missing {col}"
        assert any(c.get("id") == TestSync.cli_id for c in d["clientes"])

    def test_cleanup_sync_cliente(self, s):
        s.delete(f"{API}/clientes/{TestSync.cli_id}")


# ---------- Produtos (estoque) - NOVO endpoint esperado ----------
class TestProdutos:
    """O mobile (estoque-store.ts) chama remote.upsert('produtos', ...) e o sync
    push deveria aceitar 'produtos'. Endpoint /api/produtos é NOVO e ainda
    NÃO existe no backend — estes testes documentam a regressão."""

    prod_id = "TEST_prod_" + uuid.uuid4().hex[:8]

    def test_post_produtos_endpoint_exists(self, s):
        payload = {
            "id": TestProdutos.prod_id,
            "nome": "TEST_Filtro de ar",
            "quantidade": 10,
            "estoque_minimo": 2,
            "custo_real": 25.0,
            "preco_venda": 45.0,
        }
        r = s.post(f"{API}/produtos", json=payload)
        assert r.status_code == 200, f"POST /api/produtos retornou {r.status_code}: {r.text[:200]}"

    def test_get_produtos_list(self, s):
        r = s.get(f"{API}/produtos")
        assert r.status_code == 200, f"GET /api/produtos retornou {r.status_code}"
        assert isinstance(r.json(), list)

    def test_get_produto_by_id(self, s):
        r = s.get(f"{API}/produtos/{TestProdutos.prod_id}")
        assert r.status_code == 200, f"GET /api/produtos/{{id}} retornou {r.status_code}"

    def test_put_produto(self, s):
        r = s.put(f"{API}/produtos/{TestProdutos.prod_id}", json={"quantidade": 8})
        assert r.status_code == 200, f"PUT /api/produtos/{{id}} retornou {r.status_code}"

    def test_delete_produto(self, s):
        r = s.delete(f"{API}/produtos/{TestProdutos.prod_id}")
        assert r.status_code == 200, f"DELETE /api/produtos/{{id}} retornou {r.status_code}"

    def test_sync_push_accepts_produtos(self, s):
        """sync/push deveria upsertar produtos vindos do mobile offline."""
        pid = "TEST_sync_prod_" + uuid.uuid4().hex[:6]
        payload = {
            "produtos": [
                {"id": pid, "nome": "TEST_Sync produto", "quantidade": 5}
            ]
        }
        r = s.post(f"{API}/sync/push", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d.get("upserted", {}).get("produtos") == 1, (
            f"sync/push ignora 'produtos' — upserted={d.get('upserted')}"
        )
        # cleanup
        s.delete(f"{API}/produtos/{pid}")


# ---------- Material com produtoId/custoReal (novos campos opcionais) ----------
class TestMaterialNovosCampos:
    """A função updateStatus(concluido) do mobile baseia-se em material.produtoId
    + quantidade. O backend já tem esses campos em MaterialItem — apenas
    validamos round-trip."""

    orc_id = None

    def test_orcamento_aceita_material_com_produtoId(self, s):
        payload = {
            "clienteId": "cli-mat-" + uuid.uuid4().hex[:6],
            "clienteNome": "TEST_MatCliente",
            "materiais": [
                {
                    "descricao": "TEST_Material com produto",
                    "quantidade": 3,
                    "unidade": "un",
                    "valorUnitario": 20.0,
                    "produtoId": "prod-xyz-123",
                    "custoReal": 12.5,
                }
            ],
            "valorTotal": 60.0,
        }
        r = s.post(f"{API}/orcamentos", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        TestMaterialNovosCampos.orc_id = d["id"]
        assert d["materiais"][0]["produtoId"] == "prod-xyz-123"
        assert d["materiais"][0]["custoReal"] == 12.5

    def test_get_orcamento_preserva_campos(self, s):
        r = s.get(f"{API}/orcamentos/{TestMaterialNovosCampos.orc_id}")
        assert r.status_code == 200
        m = r.json()["materiais"][0]
        assert m["produtoId"] == "prod-xyz-123"
        assert m["custoReal"] == 12.5

    def test_cleanup(self, s):
        s.delete(f"{API}/orcamentos/{TestMaterialNovosCampos.orc_id}")


# ---------- Ordem de Serviço com novos campos detalhados ----------
class TestOSNovosCampos:
    """Iteração 3: OS agora suporta campos detalhados de equipamento
    (equipamento/marca/modelo/serie/local) + defeitosEncontrados + observacaoTecnica.
    Validar que POST aceita esses campos e que GET retorna preservando os valores.
    Também valida `model_config = {extra: allow}` aceitando campo desconhecido."""

    os_id = None

    def test_create_os_com_todos_novos_campos(self, s):
        payload = {
            "clienteId": "cli-os-" + uuid.uuid4().hex[:6],
            "clienteNome": "TEST_Cliente OS Detalhada",
            "equipamento": "Ar-condicionado split",
            "marca": "LG",
            "modelo": "Dual Inverter 12000 BTUs",
            "serie": "SN-TEST-2026-001",
            "local": "Sala de reuniões 2º andar",
            "problema": "Não está gelando adequadamente",
            "defeitosEncontrados": "Filtro entupido, gás baixo, evaporadora suja",
            "diagnostico": "Limpeza completa + recarga de gás R-410A",
            "observacaoTecnica": "Recomendar manutenção semestral",
            "status": "aberto",
            "valorTotal": 450.00,
            # campo extra arbitrário para validar extra=allow
            "campoExtraTeste": "valor_qualquer_123",
        }
        r = s.post(f"{API}/ordens", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["equipamento"] == "Ar-condicionado split"
        assert d["marca"] == "LG"
        assert d["modelo"] == "Dual Inverter 12000 BTUs"
        assert d["serie"] == "SN-TEST-2026-001"
        assert d["local"] == "Sala de reuniões 2º andar"
        assert d["defeitosEncontrados"].startswith("Filtro entupido")
        assert d["observacaoTecnica"] == "Recomendar manutenção semestral"
        # extra=allow → campo extra deve ser preservado
        assert d.get("campoExtraTeste") == "valor_qualquer_123"
        TestOSNovosCampos.os_id = d["id"]

    def test_get_os_preserva_novos_campos(self, s):
        r = s.get(f"{API}/ordens/{TestOSNovosCampos.os_id}")
        assert r.status_code == 200, r.text
        d = r.json()
        # Validar persistência no MongoDB → GET retorna o que foi salvo
        assert d["equipamento"] == "Ar-condicionado split"
        assert d["marca"] == "LG"
        assert d["modelo"] == "Dual Inverter 12000 BTUs"
        assert d["serie"] == "SN-TEST-2026-001"
        assert d["local"] == "Sala de reuniões 2º andar"
        assert d["defeitosEncontrados"].startswith("Filtro entupido")
        assert d["observacaoTecnica"] == "Recomendar manutenção semestral"
        assert d["problema"] == "Não está gelando adequadamente"
        assert d["diagnostico"].startswith("Limpeza completa")
        # extra=allow → campo extra deve persistir e voltar no GET
        assert d.get("campoExtraTeste") == "valor_qualquer_123"

    def test_update_os_modifica_campos_novos(self, s):
        r = s.put(
            f"{API}/ordens/{TestOSNovosCampos.os_id}",
            json={
                "status": "concluido",
                "observacaoTecnica": "Atualizado: cliente aceitou manutenção semestral",
                "defeitosEncontrados": "Atualizado: nada além do reportado",
            },
        )
        assert r.status_code == 200, r.text
        # GET para confirmar persistência da atualização
        r2 = s.get(f"{API}/ordens/{TestOSNovosCampos.os_id}")
        assert r2.status_code == 200
        d = r2.json()
        assert d["status"] == "concluido"
        assert d["observacaoTecnica"].startswith("Atualizado:")
        assert d["defeitosEncontrados"].startswith("Atualizado:")
        # equipamento original deve permanecer intacto
        assert d["equipamento"] == "Ar-condicionado split"

    def test_os_dashboard_conta_concluida_corretamente(self, s):
        """Após concluir a OS, dashboard deve contá-la em osConcluidas (não em osAbertas).
        Valida normalização do status 'concluido' (sem acento, lower)."""
        r = s.get(f"{API}/dashboard")
        assert r.status_code == 200
        d = r.json()
        # Não validamos número exato (depende do estado do banco), apenas tipo
        assert isinstance(d.get("osAbertas"), int)
        assert isinstance(d.get("osConcluidas"), int)
        assert d["osConcluidas"] >= 1  # nossa OS está concluída

    def test_cleanup_os(self, s):
        r = s.delete(f"{API}/ordens/{TestOSNovosCampos.os_id}")
        assert r.status_code == 200
        assert r.json().get("deleted") is True
        # GET após DELETE deve retornar 404
        r2 = s.get(f"{API}/ordens/{TestOSNovosCampos.os_id}")
        assert r2.status_code == 404


# ---------- IA Análise ----------
class TestIA:
    def test_ia_analise_executiva(self, s):
        r = s.post(f"{API}/ia/analise", json={}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "analise" in d and isinstance(d["analise"], str) and len(d["analise"]) > 20
        assert "resumo" in d and isinstance(d["resumo"], dict)
        assert "kpis" in d["resumo"]
        assert d.get("modelo") == "claude-sonnet-4-5-20250929"

    def test_ia_analise_pergunta(self, s):
        r = s.post(
            f"{API}/ia/analise",
            json={"pergunta": "Quem é meu maior cliente?"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "analise" in d
        assert len(d["analise"]) > 20
        assert d.get("modelo") == "claude-sonnet-4-5-20250929"
