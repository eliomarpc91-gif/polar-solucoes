import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { Orcamento, OrdemServico, Cliente, EmpresaConfig, ServicoItem, MaterialItem } from "./store";
import { LOGO_BASE64 } from "./logo-base64";

// ════════════════════════════════════════════════════════════
// PDF PREMIUM — POLAR SOLUÇÕES
// Design corporativo de alto padrão (SaaS Premium)
// Cores: #0D3B66 (azul escuro), #1E88E5 (azul), #2D3748 (grafite)
// ════════════════════════════════════════════════════════════

const COR_PRIMARIA = "#0D3B66";
const COR_SECUNDARIA = "#1E88E5";
const COR_GRAFITE = "#2D3748";
const COR_VERDE = "#10B981";
const COR_AMARELO = "#F59E0B";
const COR_VERMELHO = "#EF4444";
const COR_LARANJA = "#F97316";

interface OrcamentoPDFData {
  orcamento: Orcamento;
  cliente: Cliente | null;
  empresa: EmpresaConfig | null;
  equipamento?: string;
  marca?: string;
  modelo?: string;
  local?: string;
  tecnico?: string;
  servicos?: string[];
}

interface OSPDFData {
  os: OrdemServico;
  cliente: Cliente | null;
  empresa: EmpresaConfig | null;
  equipamento?: string;
  marca?: string;
  modelo?: string;
  local?: string;
  tecnico?: string;
  servicos?: string[];
}

export interface ReciboPagamentoData {
  id: string;
  clienteNome: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  descricao: string;
  valorTotal: number;
  valorPago: number;
  dataPagamento: string;
  metodoPagamento: string;
  observacoes?: string;
  empresaNome?: string;
  empresaCNPJ?: string;
  empresaTelefone?: string;
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return `R$ ${(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string): { label: string; color: string; icon: string } {
  const s = (status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  switch (s) {
    case "concluido": case "concluida": case "pago": case "aprovado":
      return { label: "CONCLUÍDO", color: COR_VERDE, icon: "✓" };
    case "em_andamento": case "em andamento": case "enviado":
      return { label: "EM ANDAMENTO", color: COR_SECUNDARIA, icon: "⏵" };
    case "aberto": case "pendente": case "rascunho":
      return { label: "PENDENTE", color: COR_LARANJA, icon: "⏱" };
    case "cancelado": case "cancelada": case "rejeitado": case "vencido":
      return { label: "CANCELADO", color: COR_VERMELHO, icon: "✕" };
    case "agendada":
      return { label: "AGENDADA", color: COR_SECUNDARIA, icon: "🗓" };
    default:
      return { label: (status || "EMITIDO").toUpperCase(), color: COR_GRAFITE, icon: "•" };
  }
}

async function gerarQRCodeDataURL(texto: string): Promise<string> {
  // Usa API pública (qrserver.com) — funciona em qualquer ambiente (mobile + web)
  // Evita depender de lib node-only que quebra no bundle Android.
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0D3B66&bgcolor=ffffff&data=${encodeURIComponent(texto)}`;
    return url;
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────
// DADOS DA EMPRESA — fallback completo
// ─────────────────────────────────────────────────────────
// Detecta logos inválidas (1x1 pixel, vazias, broken URIs) e usa fallback automático
function pickLogo(saved: unknown): string {
  if (typeof saved !== "string" || !saved) return LOGO_BASE64;
  if (saved.length < 1000) return LOGO_BASE64; // 1x1 pixel transparente tem ~114 chars
  if (saved.startsWith("data:image/") || saved.startsWith("http")) return saved;
  return LOGO_BASE64;
}

function dadosEmpresa(empresa: EmpresaConfig | null) {
  const e = empresa || {};
  return {
    nome: (e as any).nome || "Polar Soluções",
    cnpj: (e as any).cnpj || "",
    telefone: (e as any).telefone || "",
    email: (e as any).email || "",
    site: (e as any).site || "www.polarsolucoes.com.br",
    endereco: (e as any).endereco || "",
    cidade: (e as any).cidade || "",
    estado: (e as any).estado || "",
    tecnico: (e as any).tecnicoResponsavel || "",
    registro: (e as any).registroProfissional || "",
    logo: pickLogo((e as any).logo),
    instagram: (e as any).instagram || "@polarsolucoes",
    termoGarantia: (e as any).termoGarantia || "",
    diasGarantia: (e as any).diasGarantia || 90,
  };
}

// ─────────────────────────────────────────────────────────
// ESTILO BASE — CSS premium reutilizável
// ─────────────────────────────────────────────────────────
const ESTILO_BASE = `
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #2D3748; background: #fff; font-size: 11px; line-height: 1.4; }
  .page { width: 210mm; min-height: 297mm; background: #fff; position: relative; overflow: hidden; }
  .content { padding: 20px 26px 22px; position: relative; z-index: 2; }
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 480px; height: 480px;
    opacity: 0.04;
    z-index: 1;
    pointer-events: none;
  }
  table { border-collapse: collapse; width: 100%; }
`;

// ─────────────────────────────────────────────────────────
// HEADER PREMIUM (banner branco + faixa azul + tab angular)
// ─────────────────────────────────────────────────────────
function renderHeader(emp: ReturnType<typeof dadosEmpresa>, tipo: string, codigo: string, dataEmissao: string, status: string): string {
  const badge = getStatusBadge(status);
  return `
  <div style="position:relative; background:#fff; padding: 18px 26px 0;">
    <!-- TOP ROW: logo grande (já contém o nome) + 3 badges -->
    <div style="display:flex; align-items:center; justify-content:flex-start; gap:18px; padding-right:240px; padding-bottom:14px;">
      <img src="${emp.logo}" style="width:130px; height:130px; object-fit:contain; flex-shrink:0;" />
      <div style="flex:1;"></div>

      <!-- 3 mini-badges -->
      <div style="display:flex; gap:24px; margin-right: 16px;">
        ${miniBadge("QUALIDADE", "Serviço com padrão e segurança", "✓")}
        ${miniBadge("EXPERIÊNCIA", "Técnicos especializados e capacitados", "❄")}
        ${miniBadge("GARANTIA", "Serviço com garantia e confiança", "✦")}
      </div>
    </div>

    <!-- BLUE BAND com contatos -->
    <div style="background:linear-gradient(90deg, ${COR_PRIMARIA} 0%, #133F73 100%); padding: 11px 26px; margin: 0 -26px; color: #fff; position: relative;">
      <div style="display:flex; gap:32px; font-size:10.5px; padding-right:240px; flex-wrap:wrap;">
        ${emp.telefone ? `<div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:18px; height:18px; background:rgba(255,255,255,0.15); border-radius:50%; text-align:center; line-height:18px; font-size:11px;">📱</span> ${emp.telefone}</div>` : ""}
        ${emp.email ? `<div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:18px; height:18px; background:rgba(255,255,255,0.15); border-radius:50%; text-align:center; line-height:18px; font-size:11px;">✉</span> ${emp.email}</div>` : ""}
        ${emp.cnpj ? `<div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:18px; height:18px; background:rgba(255,255,255,0.15); border-radius:50%; text-align:center; line-height:18px; font-size:11px;">🏢</span> CNPJ ${emp.cnpj}</div>` : ""}
        ${emp.registro ? `<div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:18px; height:18px; background:rgba(255,255,255,0.15); border-radius:50%; text-align:center; line-height:18px; font-size:11px;">👤</span> ${emp.registro}</div>` : ""}
      </div>
    </div>

    <!-- ANGULAR RIGHT TAB (sobreposto) -->
    <div style="position:absolute; top:6px; right:0; width:226px;">
      <!-- Decoração geométrica -->
      <div style="background:${COR_PRIMARIA}; padding: 14px 18px 16px; border-radius: 0 0 0 18px; box-shadow: 0 2px 8px rgba(13,59,102,0.18); color:#fff; position:relative;">
        <!-- Triângulo decorativo claro -->
        <div style="position:absolute; left:-22px; top:0; width:0; height:0; border-top:38px solid ${COR_SECUNDARIA}; border-left:22px solid transparent;"></div>
        <div style="position:absolute; left:-46px; top:32px; width:0; height:0; border-top:30px solid rgba(30,136,229,0.4); border-left:24px solid transparent;"></div>

        <div style="font-size:10px; font-weight:600; letter-spacing:1.5px; opacity:0.85;">${tipo.toUpperCase()}</div>
        <div style="font-size:34px; font-weight:900; letter-spacing:-1.5px; line-height:1; margin-top:2px;">#${codigo}</div>

        <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.18);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:10px;">📅</span>
            <span style="font-size:8px; font-weight:600; letter-spacing:0.5px; opacity:0.7;">DATA DA EMISSÃO</span>
          </div>
          <div style="font-size:11.5px; font-weight:700;">${formatDate(dataEmissao)}</div>

          <div style="display:flex; align-items:center; gap:8px; margin: 10px 0 4px;">
            <span style="font-size:10px;">⚡</span>
            <span style="font-size:8px; font-weight:600; letter-spacing:0.5px; opacity:0.7;">STATUS</span>
          </div>
          <div style="display:inline-block; background:${badge.color}; color:#fff; font-size:10px; font-weight:800; padding:5px 12px; border-radius:14px; letter-spacing:0.5px;">
            ${badge.icon} ${badge.label}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function miniBadge(title: string, desc: string, icon: string): string {
  return `
  <div style="display:flex; align-items:center; gap:8px; max-width:130px;">
    <div style="width:24px; height:24px; background:#EBF5FF; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:1.5px solid ${COR_SECUNDARIA};">
      <span style="font-size:11px; color:${COR_SECUNDARIA};">${icon}</span>
    </div>
    <div>
      <div style="font-size:9px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:0.5px;">${title}</div>
      <div style="font-size:7.5px; color:#64748B; line-height:1.3;">${desc}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// 4 CARDS DE RESUMO (Cliente, Equipamento, Técnico, Garantia)
// ─────────────────────────────────────────────────────────
function renderCards(opts: {
  clienteNome: string;
  clienteTelefone?: string;
  equipamento: string;
  marcaModelo?: string;
  tecnico: string;
  registroTecnico?: string;
  diasGarantia: number;
}): string {
  return `
  <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; margin-bottom:14px;">
    ${cardResumo("👤", "CLIENTE", opts.clienteNome, opts.clienteTelefone ? `📞 ${opts.clienteTelefone}` : "")}
    ${cardResumo("📦", "EQUIPAMENTO", opts.equipamento || "—", opts.marcaModelo ? `MARCA / MODELO\n${opts.marcaModelo}` : "MARCA / MODELO\n—")}
    ${cardResumo("🛠", "TÉCNICO RESPONSÁVEL", opts.tecnico || "—", opts.registroTecnico ? `REGISTRO\n${opts.registroTecnico}` : "")}
    ${cardResumo("🛡", "GARANTIA DO SERVIÇO", `${opts.diasGarantia} DIAS`, "Conforme termo de garantia", true)}
  </div>`;
}

function cardResumo(icon: string, titulo: string, valor: string, sub: string, garantia = false): string {
  const subFormatted = sub.split("\n").map((l, i) => i === 0 && l.includes("/") ? `<div style="font-size:7.5px; font-weight:700; color:${COR_PRIMARIA}; letter-spacing:0.6px; margin-top:6px;">${l}</div>` : `<div style="font-size:9px; color:#64748B; margin-top:2px;">${l}</div>`).join("");
  return `
  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:11px 12px;">
    <div style="display:flex; align-items:center; gap:7px; margin-bottom:8px;">
      <div style="width:26px; height:26px; background:${COR_SECUNDARIA}; border-radius:7px; display:flex; align-items:center; justify-content:center;">
        <span style="font-size:13px;">${icon}</span>
      </div>
      <div style="font-size:9.5px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:0.8px;">${titulo}</div>
    </div>
    <div style="font-size:${garantia ? 14 : 11}px; font-weight:${garantia ? 900 : 700}; color:${COR_GRAFITE}; line-height:1.2;">${valor}</div>
    ${subFormatted}
  </div>`;
}

// ─────────────────────────────────────────────────────────
// ALERTA COLORIDO (problema, defeitos, diagnóstico, observação)
// ─────────────────────────────────────────────────────────
function alertaSecao(titulo: string, conteudo: string, cor: string, icon: string): string {
  if (!conteudo || !conteudo.trim()) return "";
  return `
  <div style="background:#fff; border:1px solid #E2E8F0; border-radius:10px; padding: 11px 14px 11px 16px; margin-bottom:8px; display:flex; gap:11px; align-items:flex-start;">
    <div style="width:30px; height:30px; background:${cor}1A; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
      <span style="font-size:15px; color:${cor};">${icon}</span>
    </div>
    <div style="flex:1;">
      <div style="font-size:10px; font-weight:800; color:${cor}; letter-spacing:1px; margin-bottom:4px;">${titulo}</div>
      <div style="font-size:10.5px; color:${COR_GRAFITE}; line-height:1.5;">${conteudo.replace(/\n/g, "<br>")}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// LISTA DE EQUIPAMENTOS (cada um com problema/diagnóstico/status)
// ─────────────────────────────────────────────────────────
function renderEquipamentosLista(equipamentos: any[]): string {
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    aguardando_diagnostico: { label: "Aguardando diagnóstico", color: "#10B981", bg: "#ECFDF5" },
    orcamento_enviado: { label: "Orçamento enviado", color: "#1E88E5", bg: "#EFF6FF" },
    aprovado: { label: "Aprovado", color: "#0D3B66", bg: "#DBEAFE" },
    em_execucao: { label: "Em execução", color: "#F59E0B", bg: "#FEF3C7" },
    concluido: { label: "Concluído", color: "#10B981", bg: "#D1FAE5" },
    sem_reparo: { label: "Sem reparo", color: "#EF4444", bg: "#FEE2E2" },
  };

  const cards = equipamentos.map((eq, idx) => {
    const numero = String(idx + 1).padStart(2, "0");
    const stat = statusMap[eq.status] || statusMap.aguardando_diagnostico;
    return `
    <div style="background:#fff; border:1px solid #E5E7EB; border-radius:10px; padding:14px 16px; margin-bottom:10px; box-shadow:0 1px 3px rgba(13,59,102,0.04);">
      <!-- Header -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #F1F5F9;">
        <div style="width:30px; height:30px; border-radius:15px; background:${COR_SECUNDARIA}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:11px;">${numero}</div>
        <div style="flex:1; font-size:13px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:-0.2px;">${eq.tipo ? escapeHtml(eq.tipo) : `Equipamento ${numero}`}</div>
        <div style="background:${stat.bg}; color:${stat.color}; padding:4px 10px; border-radius:14px; font-size:9.5px; font-weight:700; letter-spacing:0.3px;">${stat.label}</div>
      </div>
      <!-- Grid Marca/Modelo/Série -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:10px;">
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">MARCA</div>
          <div style="font-size:11px; font-weight:700; color:${COR_GRAFITE}; margin-top:2px;">${eq.marca || "—"}</div>
        </div>
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">MODELO</div>
          <div style="font-size:11px; font-weight:700; color:${COR_GRAFITE}; margin-top:2px;">${eq.modelo || "—"}</div>
        </div>
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">Nº SÉRIE</div>
          <div style="font-size:11px; font-weight:700; color:${COR_GRAFITE}; margin-top:2px;">${eq.serie || "—"}</div>
        </div>
      </div>
      ${(eq.patrimonio || eq.localizacao) ? `
      <!-- Grid Patrimonio/Localizacao -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">PATRIMÔNIO</div>
          <div style="font-size:11px; font-weight:700; color:${COR_GRAFITE}; margin-top:2px;">${eq.patrimonio || "—"}</div>
        </div>
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">LOCALIZAÇÃO</div>
          <div style="font-size:11px; font-weight:700; color:${COR_GRAFITE}; margin-top:2px;">${eq.localizacao || "—"}</div>
        </div>
      </div>` : ""}
      <!-- Problema -->
      ${eq.problema ? `
      <div style="background:#FEF9C3; border-left:3px solid ${COR_AMARELO}; border-radius:6px; padding:8px 11px; margin-bottom:8px;">
        <div style="font-size:8.5px; font-weight:800; color:${COR_AMARELO}; letter-spacing:0.8px; margin-bottom:3px;">⚠ PROBLEMA RELATADO</div>
        <div style="font-size:10px; color:${COR_GRAFITE}; line-height:1.4;">${String(eq.problema).replace(/\n/g, "<br>")}</div>
      </div>` : ""}
      <!-- Diagnóstico -->
      ${eq.diagnostico ? `
      <div style="background:#D1FAE5; border-left:3px solid ${COR_VERDE}; border-radius:6px; padding:8px 11px;">
        <div style="font-size:8.5px; font-weight:800; color:${COR_VERDE}; letter-spacing:0.8px; margin-bottom:3px;">🛠 DIAGNÓSTICO TÉCNICO</div>
        <div style="font-size:10px; color:${COR_GRAFITE}; line-height:1.4;">${String(eq.diagnostico).replace(/\n/g, "<br>")}</div>
      </div>` : ""}
    </div>`;
  }).join("");

  return `
  <div style="margin-top:14px;">
    <div style="font-size:12px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:1px; margin-bottom:8px;">EQUIPAMENTOS ATENDIDOS</div>
    ${cards}
  </div>`;
}

// ─────────────────────────────────────────────────────────
// DUAS TABELAS SEPARADAS: SERVIÇOS + MATERIAIS/PEÇAS
// extrasOperacionais: total de gastos operacionais (deslocamento, mão de obra, hospedagem, etc.)
//                     será DILUÍDO proporcionalmente nos serviços (cliente não vê separado).
// Cada item pode ter um campo opcional "detalhes" que aparece abaixo do nome.
// ─────────────────────────────────────────────────────────
function renderTabelaServicos(itens: ServicoItem[] = [], extrasOperacionais = 0): { html: string; subtotal: number } {
  const rows: string[] = [];
  const totalServicos = (itens || []).reduce((s: number, item: any) => s + (item.valor || 0) * (item.quantidade || 1), 0);
  const distribuiExtras = extrasOperacionais > 0 && totalServicos > 0;
  let subtotal = 0;

  (itens || []).forEach((s: any, i: number) => {
    const qtd = s.quantidade || 1;
    const subServ = (s.valor || 0) * qtd;
    let extraAlocado = 0;
    if (distribuiExtras) {
      const ultimoServico = i === (itens || []).length - 1;
      if (ultimoServico) {
        const distribuidoAteAgora = (itens || [])
          .slice(0, i)
          .reduce((s2: number, item2: any) => s2 + ((extrasOperacionais * ((item2.valor || 0) * (item2.quantidade || 1))) / totalServicos), 0);
        extraAlocado = extrasOperacionais - distribuidoAteAgora;
      } else {
        extraAlocado = (extrasOperacionais * subServ) / totalServicos;
      }
    }
    const totalLinha = subServ + extraAlocado;
    subtotal += totalLinha;
    const unitFinal = qtd > 0 ? totalLinha / qtd : totalLinha;
    const detalhes = (s.detalhes || s.descricaoTecnica || "").toString().trim();
    rows.push(`
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:11px 12px; font-weight:600; color:${COR_PRIMARIA}; vertical-align:top;">${i + 1}</td>
        <td style="padding:11px 12px; vertical-align:top;">
          <div style="color:${COR_GRAFITE}; font-weight:700;">${s.descricao || s.nome || "—"}</div>
          ${detalhes ? `<div style="color:#64748B; font-size:10px; margin-top:3px; line-height:1.4; white-space:pre-wrap;">${escapeHtml(detalhes)}</div>` : ""}
        </td>
        <td style="padding:11px 12px; text-align:center; color:${COR_GRAFITE}; vertical-align:top;">${qtd}</td>
        <td style="padding:11px 12px; text-align:center; color:#64748B; vertical-align:top;">un</td>
        <td style="padding:11px 12px; text-align:right; color:${COR_GRAFITE}; vertical-align:top;">${formatCurrency(unitFinal)}</td>
        <td style="padding:11px 12px; text-align:right; font-weight:700; color:${COR_PRIMARIA}; vertical-align:top;">${formatCurrency(totalLinha)}</td>
      </tr>`);
  });

  if (rows.length === 0) return { html: "", subtotal: 0 };

  return {
    subtotal,
    html: `
    <div style="margin-top:14px;">
      <div style="font-size:12px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:1px; margin-bottom:8px;">🔧 SERVIÇOS EXECUTADOS</div>
      <table style="border:1px solid #E2E8F0; border-radius:10px; overflow:hidden; width:100%;">
        <thead>
          <tr style="background:${COR_PRIMARIA}; color:#fff;">
            <th style="padding:10px 12px; text-align:left; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:35px;">#</th>
            <th style="padding:10px 12px; text-align:left; font-size:9.5px; letter-spacing:0.8px; font-weight:700;">DESCRIÇÃO</th>
            <th style="padding:10px 12px; text-align:center; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:55px;">QTD.</th>
            <th style="padding:10px 12px; text-align:center; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:55px;">UNID.</th>
            <th style="padding:10px 12px; text-align:right; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:95px;">VALOR UNIT.</th>
            <th style="padding:10px 12px; text-align:right; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:100px;">VALOR TOTAL</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
        <tfoot>
          <tr style="background:#F8FAFC;">
            <td colspan="5" style="padding:10px 12px; text-align:right; font-weight:800; color:${COR_PRIMARIA}; font-size:11px; letter-spacing:0.5px;">SUBTOTAL SERVIÇOS</td>
            <td style="padding:10px 12px; text-align:right; font-weight:900; color:${COR_PRIMARIA}; font-size:13px;">${formatCurrency(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`,
  };
}

function renderTabelaMateriais(materiais: MaterialItem[] = []): { html: string; subtotal: number } {
  const rows: string[] = [];
  let subtotal = 0;

  (materiais || []).forEach((m: any, i: number) => {
    const qtd = m.quantidade || 1;
    const base = (m.valorUnitario || 0) * qtd;
    const lucro = base * ((m.lucroPercent || 0) / 100);
    const total = base + lucro + (m.frete || 0);
    subtotal += total;
    const unitarioFinal = qtd > 0 ? total / qtd : total;
    const detalhes = (m.detalhes || m.descricaoMaterial || "").toString().trim();
    rows.push(`
      <tr style="border-bottom:1px solid #F1F5F9; background:#FAFBFC;">
        <td style="padding:11px 12px; font-weight:600; color:${COR_LARANJA}; vertical-align:top;">${i + 1}</td>
        <td style="padding:11px 12px; vertical-align:top;">
          <div style="color:${COR_GRAFITE}; font-weight:700;">${m.descricao || m.nome || "—"}</div>
          ${detalhes ? `<div style="color:#64748B; font-size:10px; margin-top:3px; line-height:1.4; white-space:pre-wrap;">${escapeHtml(detalhes)}</div>` : ""}
        </td>
        <td style="padding:11px 12px; text-align:center; color:${COR_GRAFITE}; vertical-align:top;">${qtd}</td>
        <td style="padding:11px 12px; text-align:center; color:#64748B; vertical-align:top;">${m.unidade || "un"}</td>
        <td style="padding:11px 12px; text-align:right; color:${COR_GRAFITE}; vertical-align:top;">${formatCurrency(unitarioFinal)}</td>
        <td style="padding:11px 12px; text-align:right; font-weight:700; color:${COR_LARANJA}; vertical-align:top;">${formatCurrency(total)}</td>
      </tr>`);
  });

  if (rows.length === 0) return { html: "", subtotal: 0 };

  return {
    subtotal,
    html: `
    <div style="margin-top:14px;">
      <div style="font-size:12px; font-weight:800; color:${COR_LARANJA}; letter-spacing:1px; margin-bottom:8px;">📦 MATERIAIS / PEÇAS</div>
      <table style="border:1px solid #E2E8F0; border-radius:10px; overflow:hidden; width:100%;">
        <thead>
          <tr style="background:${COR_LARANJA}; color:#fff;">
            <th style="padding:10px 12px; text-align:left; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:35px;">#</th>
            <th style="padding:10px 12px; text-align:left; font-size:9.5px; letter-spacing:0.8px; font-weight:700;">DESCRIÇÃO</th>
            <th style="padding:10px 12px; text-align:center; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:55px;">QTD.</th>
            <th style="padding:10px 12px; text-align:center; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:55px;">UNID.</th>
            <th style="padding:10px 12px; text-align:right; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:95px;">VALOR UNIT.</th>
            <th style="padding:10px 12px; text-align:right; font-size:9.5px; letter-spacing:0.8px; font-weight:700; width:100px;">VALOR TOTAL</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
        <tfoot>
          <tr style="background:#FFF7ED;">
            <td colspan="5" style="padding:10px 12px; text-align:right; font-weight:800; color:${COR_LARANJA}; font-size:11px; letter-spacing:0.5px;">SUBTOTAL MATERIAIS</td>
            <td style="padding:10px 12px; text-align:right; font-weight:900; color:${COR_LARANJA}; font-size:13px;">${formatCurrency(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`,
  };
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Função de retrocompat — chamada pelos PDFs ainda
function renderTabela(itens: ServicoItem[] = [], materiais: MaterialItem[] = [], titulo = "SERVIÇOS EXECUTADOS", extrasOperacionais = 0): string {
  const tabServ = renderTabelaServicos(itens, extrasOperacionais);
  const tabMat = renderTabelaMateriais(materiais);
  if (!tabServ.html && !tabMat.html) {
    return `<div style="margin-top:14px; padding:18px; text-align:center; color:#94A3B8; font-style:italic; border:1px solid #E2E8F0; border-radius:10px;">Nenhum item lançado.</div>`;
  }
  let html = tabServ.html + tabMat.html;
  // Total geral combinando os dois subtotais
  if (tabServ.html && tabMat.html) {
    const total = tabServ.subtotal + tabMat.subtotal;
    html += `
    <div style="margin-top:10px; display:flex; justify-content:flex-end;">
      <div style="background:${COR_PRIMARIA}; padding:10px 18px; border-radius:8px; color:#fff;">
        <span style="font-size:11px; letter-spacing:0.8px; font-weight:700; margin-right:10px; opacity:0.85;">TOTAL GERAL</span>
        <span style="font-size:16px; font-weight:900;">${formatCurrency(total)}</span>
      </div>
    </div>`;
  }
  return html;
}

// ─────────────────────────────────────────────────────────
// CARD INVESTIMENTO TOTAL com Subtotal e Desconto opcionais
// ─────────────────────────────────────────────────────────
function renderInvestimentoTotal(
  valor: number,
  label = "INVESTIMENTO TOTAL",
  desconto?: { tipo: "percentual" | "fixo"; valor: number },
  valorSubtotal?: number,
  valorDesconto?: number,
): string {
  const temDesconto = !!desconto && (valorDesconto ?? 0) > 0;
  const descontoLabel = desconto
    ? desconto.tipo === "percentual"
      ? `DESCONTO (${desconto.valor}%)`
      : `DESCONTO`
    : "DESCONTO";

  if (!temDesconto) {
    return `
    <div style="display:flex; justify-content:flex-end; margin-top:14px;">
      <div style="background:linear-gradient(135deg, ${COR_PRIMARIA} 0%, #133F73 100%); border-radius:12px; padding:14px 24px; min-width:320px; text-align:center; box-shadow:0 4px 12px rgba(13,59,102,0.18);">
        <div style="font-size:10px; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:2px; margin-bottom:4px;">${label}</div>
        <div style="font-size:28px; font-weight:900; color:#fff; letter-spacing:-0.8px;">${formatCurrency(valor)}</div>
      </div>
    </div>`;
  }

  return `
  <div style="display:flex; justify-content:flex-end; margin-top:14px;">
    <div style="min-width:340px;">
      <!-- Subtotal -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 18px; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11px; font-weight:700; color:#64748B; letter-spacing:0.8px;">SUBTOTAL</span>
        <span style="font-size:14px; font-weight:800; color:${COR_GRAFITE};">${formatCurrency(valorSubtotal || 0)}</span>
      </div>
      <!-- Desconto -->
      <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:10px 18px; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11px; font-weight:800; color:#DC2626; letter-spacing:0.8px;">${descontoLabel}</span>
        <span style="font-size:14px; font-weight:800; color:#DC2626;">- ${formatCurrency(valorDesconto || 0)}</span>
      </div>
      <!-- Total final -->
      <div style="background:linear-gradient(135deg, ${COR_PRIMARIA} 0%, #133F73 100%); border-radius:12px; padding:14px 24px; text-align:center; box-shadow:0 4px 12px rgba(13,59,102,0.18);">
        <div style="font-size:10px; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:2px; margin-bottom:4px;">${label}</div>
        <div style="font-size:28px; font-weight:900; color:#fff; letter-spacing:-0.8px;">${formatCurrency(valor)}</div>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// TERMO DE GARANTIA (texto legal em 2 colunas)
// ─────────────────────────────────────────────────────────
function renderTermoGarantia(diasGarantia: number, termoCustomizado?: string): string {
  if (termoCustomizado && termoCustomizado.trim()) {
    return `
    <div style="margin-top:18px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px 18px;">
      <div style="font-size:12px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:1px; margin-bottom:10px;">TERMO DE GARANTIA</div>
      <div style="font-size:9.5px; color:${COR_GRAFITE}; line-height:1.6; white-space:pre-wrap;">${termoCustomizado}</div>
    </div>`;
  }
  return `
  <div style="margin-top:18px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px 18px;">
    <div style="font-size:12px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:1px; margin-bottom:12px;">TERMO DE GARANTIA</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; font-size:9px; line-height:1.55; color:${COR_GRAFITE};">
      <div>
        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-bottom:3px;">1. PRAZO DE GARANTIA</div>
        <div style="margin-bottom:9px;">A garantia dos serviços executados é de <strong>${diasGarantia} (${numeroPorExtensoMasc(diasGarantia)}) dias</strong>, contados da data da conclusão do serviço, conforme art. 26, inciso II, do CDC.</div>

        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-bottom:3px;">2. COBERTURA DA GARANTIA</div>
        <div style="margin-bottom:4px;"><strong>Estão cobertos:</strong></div>
        <div>- Defeitos de execução do serviço prestado;</div>
        <div>- Vícios decorrentes da mão de obra empregada;</div>
        <div>- Peças instaladas pela Polar Soluções dentro do prazo de garantia do fabricante.</div>

        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-top:9px; margin-bottom:3px;">3. EXCLUSÕES DA GARANTIA</div>
        <div style="margin-bottom:4px;"><strong>Não estão cobertos:</strong></div>
        <div>- Danos causados por mau uso, negligência ou imperícia do usuário;</div>
        <div>- Falta de manutenção preventiva recomendada;</div>
        <div>- Intervenções de terceiros não autorizados;</div>
        <div>- Causas externas (oscilações elétricas, infiltrações, intempéries);</div>
        <div>- Componentes não fornecidos pela Polar Soluções;</div>
        <div>- Desgaste natural decorrente do uso.</div>
      </div>
      <div>
        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-bottom:3px;">4. ACIONAMENTO DA GARANTIA</div>
        <div style="margin-bottom:9px;">Para acionar a garantia, o cliente deve entrar em contato com a Polar Soluções por meio dos canais oficiais, apresentando este termo e a respectiva nota fiscal/recibo de pagamento.</div>

        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-bottom:3px;">5. ATENDIMENTO</div>
        <div style="margin-bottom:9px;">A Polar Soluções se compromete a atender o chamado em até 5 (cinco) dias úteis após a comunicação do problema, conforme art. 18, §1º, do CDC.</div>

        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-bottom:3px;">6. DIREITOS DO CONSUMIDOR</div>
        <div style="margin-bottom:9px;">Nada obstante esta garantia contratual, ficam assegurados ao cliente todos os direitos previstos no Código de Defesa do Consumidor.</div>

        <div style="font-weight:800; color:${COR_PRIMARIA}; font-size:9.5px; margin-bottom:3px;">7. ACEITE</div>
        <div>A aceitação dos serviços implica concordância com os termos desta garantia.</div>

        <div style="margin-top:14px; font-weight:700; color:${COR_PRIMARIA};">Polar Soluções</div>
      </div>
    </div>
  </div>`;
}

function numeroPorExtensoMasc(n: number): string {
  const map: any = { 30: "trinta", 60: "sessenta", 90: "noventa", 120: "cento e vinte", 180: "cento e oitenta", 365: "trezentos e sessenta e cinco" };
  return map[n] || String(n);
}

// ─────────────────────────────────────────────────────────
// FORMA DE PAGAMENTO + QR CODE
// ─────────────────────────────────────────────────────────
function renderPagamentoQR(valorTotal: number, qrDataURL: string, codigoDocumento: string, tipo: string): string {
  const entrada = valorTotal / 2;
  const saldo = valorTotal - entrada;
  return `
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px;">
    <!-- Forma de pagamento -->
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <div style="width:28px; height:28px; background:${COR_SECUNDARIA}; border-radius:6px; display:flex; align-items:center; justify-content:center;">
          <span style="font-size:13px; color:#fff;">💳</span>
        </div>
        <div style="font-size:11.5px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:0.8px;">FORMA DE PAGAMENTO</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">ENTRADA (50%)</div>
          <div style="font-size:16px; font-weight:800; color:${COR_GRAFITE};">${formatCurrency(entrada)}</div>
        </div>
        <div>
          <div style="font-size:8.5px; font-weight:700; color:#64748B; letter-spacing:1px;">SALDO FINAL (50%)</div>
          <div style="font-size:16px; font-weight:800; color:${COR_GRAFITE};">${formatCurrency(saldo)}</div>
        </div>
      </div>
    </div>
    <!-- QR Code -->
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px; display:flex; align-items:center; gap:14px;">
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <div style="width:28px; height:28px; background:${COR_VERDE}; border-radius:6px; display:flex; align-items:center; justify-content:center;">
            <span style="font-size:13px; color:#fff;">🛡</span>
          </div>
          <div>
            <div style="font-size:11.5px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:0.8px;">PAGAMENTO SEGURO</div>
            <div style="font-size:9px; color:#64748B; margin-top:1px;">Obrigado pela confiança!</div>
          </div>
        </div>
      </div>
      ${qrDataURL ? `<img src="${qrDataURL}" style="width:74px; height:74px; border-radius:8px;" />` : ""}
      <div style="font-size:8px; color:#64748B; max-width:90px; line-height:1.4;">Escaneie o QR Code para validar esta ${tipo.toLowerCase()}.</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// ASSINATURAS
// ─────────────────────────────────────────────────────────
function renderAssinaturas(clienteNome: string, tecnicoNome: string, registroTecnico: string): string {
  return `
  <div style="margin-top:18px; background:#fff; border:1px solid #E2E8F0; border-radius:10px; padding:18px 20px;">
    <div style="display:grid; grid-template-columns:1fr 80px 1fr; gap:18px; align-items:center;">
      <div style="text-align:center;">
        <div style="font-size:10px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:1px; margin-bottom:30px;">CLIENTE</div>
        <div style="border-bottom:1.5px solid ${COR_GRAFITE}; height:2px; margin-bottom:8px;"></div>
        <div style="font-size:10.5px; color:${COR_GRAFITE}; font-weight:600;">${clienteNome}</div>
      </div>
      <div style="text-align:center;">
        <div style="width:44px; height:44px; background:${COR_VERDE}; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto; box-shadow:0 2px 8px rgba(16,185,129,0.35);">
          <span style="color:#fff; font-size:22px; font-weight:900;">✓</span>
        </div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:10px; font-weight:800; color:${COR_PRIMARIA}; letter-spacing:1px; margin-bottom:6px;">TÉCNICO RESPONSÁVEL</div>
        <div style="height:30px; display:flex; align-items:center; justify-content:center;">
          <div style="font-family:'Brush Script MT', cursive; font-size:18px; color:${COR_PRIMARIA}; transform:rotate(-3deg);">${tecnicoNome ? tecnicoNome.split(" ").slice(0, 2).join(" ") : ""}</div>
        </div>
        <div style="border-bottom:1.5px solid ${COR_GRAFITE}; height:2px; margin-bottom:8px;"></div>
        <div style="font-size:10.5px; color:${COR_GRAFITE}; font-weight:600;">${tecnicoNome || "—"}</div>
        ${registroTecnico ? `<div style="font-size:9px; color:#64748B; margin-top:2px;">${registroTecnico}</div>` : ""}
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// FOOTER PREMIUM (azul escuro com logo + serviços + redes)
// ─────────────────────────────────────────────────────────
function renderFooter(emp: ReturnType<typeof dadosEmpresa>): string {
  return `
  <div style="margin-top:20px; background:linear-gradient(90deg, ${COR_PRIMARIA} 0%, #133F73 100%); color:#fff; padding:18px 26px; border-top:3px solid ${COR_SECUNDARIA};">
    <div style="display:grid; grid-template-columns:auto 1fr 1fr auto; gap:20px; align-items:center;">
      <!-- Logo (rodapé) -->
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${emp.logo}" style="width:70px; height:70px; object-fit:contain; background:#fff; border-radius:8px; padding:3px;" />
      </div>
      <!-- Serviços -->
      <div>
        <div style="font-size:9px; opacity:0.95; margin-bottom:3px;">✓ Refrigeração Comercial</div>
        <div style="font-size:9px; opacity:0.95; margin-bottom:3px;">✓ Climatização</div>
        <div style="font-size:9px; opacity:0.95;">✓ Manutenção Preventiva e Corretiva</div>
      </div>
      <!-- Contatos -->
      <div>
        ${emp.telefone ? `<div style="font-size:9px; margin-bottom:3px;">📱 ${emp.telefone}</div>` : ""}
        ${emp.email ? `<div style="font-size:9px; margin-bottom:3px;">✉ ${emp.email}</div>` : ""}
        <div style="font-size:9px;">🌐 ${emp.site}</div>
      </div>
      <!-- Redes sociais -->
      <div style="text-align:right;">
        <div style="font-size:8px; font-weight:700; letter-spacing:1.2px; margin-bottom:6px; opacity:0.85;">SIGA NOSSAS REDES</div>
        <div style="display:flex; gap:6px; justify-content:flex-end;">
          <div style="width:24px; height:24px; background:rgba(255,255,255,0.18); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px;">📷</div>
          <div style="width:24px; height:24px; background:rgba(255,255,255,0.18); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px;">f</div>
          <div style="width:24px; height:24px; background:rgba(255,255,255,0.18); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px;">in</div>
        </div>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// MARCA D'ÁGUA (logo central em 4% opacidade)
// ─────────────────────────────────────────────────────────
function renderWatermark(logo: string): string {
  return `<img src="${logo}" class="watermark" style="opacity:0.04;" />`;
}

// ═══════════════════════════════════════════════════════════
// BUILD DO HTML PRINCIPAL
// ═══════════════════════════════════════════════════════════
async function buildPDFHTML(opts: {
  tipo: "ORDEM DE SERVIÇO" | "ORÇAMENTO" | "RECIBO" | "RELATÓRIO";
  codigo: string;
  status: string;
  dataEmissao: string;
  empresa: EmpresaConfig | null;
  clienteNome: string;
  clienteTelefone?: string;
  equipamento?: string;
  marcaModelo?: string;
  local?: string;
  tecnico?: string;
  problema?: string;
  defeitos?: string;
  diagnostico?: string;
  observacaoTecnica?: string;
  itens?: ServicoItem[];
  materiais?: MaterialItem[];
  valorTotal: number;
  labelValor?: string;
  conteudoCustom?: string; // para Relatório/IA
  equipamentosLista?: any[]; // NOVO: equipamentos individuais com problema/diagnostico/status
  extrasOperacionais?: number; // gastos operacionais a diluir nos serviços (custoDeslocamento + custoMaoDeObra + gastos)
  desconto?: { tipo: "percentual" | "fixo"; valor: number };
  valorSubtotal?: number;
  valorDesconto?: number;
}): Promise<string> {
  const emp = dadosEmpresa(opts.empresa);
  const tecnico = opts.tecnico || emp.tecnico || "—";
  const qrPayload = `https://polarsolucoes.com.br/validar/${opts.tipo.replace(/\s/g, "_").toLowerCase()}/${opts.codigo}`;
  const qrDataURL = await gerarQRCodeDataURL(qrPayload);

  const sections: string[] = [];

  if (opts.conteudoCustom) {
    sections.push(opts.conteudoCustom);
  } else {
    // NOVO: Se temos lista de equipamentos individuais, mostra cada um com seu problema/diagnóstico/status
    if (opts.equipamentosLista && opts.equipamentosLista.length > 0) {
      sections.push(renderEquipamentosLista(opts.equipamentosLista));
    } else {
      // Fallback: campos globais (compatibilidade)
      sections.push(alertaSecao("PROBLEMA RELATADO", opts.problema || "", COR_AMARELO, "⚠"));
      sections.push(alertaSecao("DEFEITOS ENCONTRADOS", opts.defeitos || "", COR_VERMELHO, "🔍"));
      sections.push(alertaSecao("DIAGNÓSTICO E SOLUÇÃO TÉCNICA", opts.diagnostico || "", COR_VERDE, "🛠"));
      sections.push(alertaSecao("OBSERVAÇÃO TÉCNICA", opts.observacaoTecnica || "", COR_SECUNDARIA, "📋"));
    }
    sections.push(renderTabela(opts.itens || [], opts.materiais || [], "SERVIÇOS EXECUTADOS", opts.extrasOperacionais || 0));
    sections.push(renderInvestimentoTotal(opts.valorTotal, opts.labelValor || "INVESTIMENTO TOTAL", opts.desconto, opts.valorSubtotal, opts.valorDesconto));
    sections.push(renderTermoGarantia(emp.diasGarantia, emp.termoGarantia));
    sections.push(renderPagamentoQR(opts.valorTotal, qrDataURL, opts.codigo, opts.tipo));
    sections.push(renderAssinaturas(opts.clienteNome, tecnico, emp.registro));
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${opts.tipo} #${opts.codigo}</title>
  <style>${ESTILO_BASE}</style>
</head>
<body>
  <div class="page">
    ${renderWatermark(emp.logo)}
    ${renderHeader(emp, opts.tipo, opts.codigo, opts.dataEmissao, opts.status)}
    <div class="content">
      ${opts.conteudoCustom ? "" : renderCards({
        clienteNome: opts.clienteNome,
        clienteTelefone: opts.clienteTelefone,
        equipamento: opts.equipamento || "—",
        marcaModelo: opts.marcaModelo,
        tecnico,
        registroTecnico: emp.registro,
        diasGarantia: emp.diasGarantia,
      })}
      ${sections.join("")}
    </div>
    ${renderFooter(emp)}
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// EXPORTAÇÕES PÚBLICAS
// ═══════════════════════════════════════════════════════════

export async function generateOrcamentoPDF(data: OrcamentoPDFData): Promise<void> {
  const orc = data.orcamento as any;
  const cliente = data.cliente;
  const empresa = data.empresa;
  const equipPrincipal = orc.equipamentos?.[0] || {};

  // Detecta se o orçamento tem equipamentos com problema/diagnóstico (formato novo)
  const equipamentosComProblema = (orc.equipamentos || []).filter(
    (e: any) => e && (e.problema || e.diagnostico || e.tipo || e.marca || e.modelo)
  );
  const usarListaEquipamentos = equipamentosComProblema.length > 0;

  const html = await buildPDFHTML({
    tipo: "ORÇAMENTO",
    codigo: (orc.codigo || orc.numero || orc.id?.slice(0, 8) || "—").toString().replace(/^ORC-?/i, "").padStart(4, "0"),
    status: orc.status || "rascunho",
    dataEmissao: orc.criadoEm || orc.dataCriacao || new Date().toISOString(),
    empresa,
    clienteNome: cliente?.nome || orc.clienteNome || "—",
    clienteTelefone: cliente?.telefone,
    equipamento: data.equipamento || orc.equipamento || equipPrincipal.tipo || equipPrincipal.marca || (usarListaEquipamentos ? `${equipamentosComProblema.length} equipamento(s)` : "—"),
    marcaModelo: usarListaEquipamentos
      ? "Ver detalhes abaixo"
      : ([data.marca || orc.marca || equipPrincipal.marca, data.modelo || orc.modelo || equipPrincipal.modelo].filter(Boolean).join(" / ") || "—"),
    local: data.local || orc.local,
    tecnico: data.tecnico || orc.tecnicoResponsavel || (empresa as any)?.tecnicoResponsavel,
    problema: usarListaEquipamentos ? "" : (orc.problema || ""),
    defeitos: orc.defeitosEncontrados || orc.defeitos || "",
    diagnostico: usarListaEquipamentos ? "" : (orc.diagnostico || ""),
    observacaoTecnica: orc.observacaoTecnica || orc.observacoes || "",
    itens: orc.itens || orc.servicos || [],
    materiais: orc.materiais || [],
    valorTotal: orc.valorTotal || 0,
    equipamentosLista: usarListaEquipamentos ? equipamentosComProblema : undefined,
    extrasOperacionais: (() => {
      // Soma dos gastos operacionais do orçamento (transporte, alimentação, hospedagem, outros)
      // + custo de mão de obra (se houver) para diluir nos serviços (cliente não vê separado)
      const g = (orc as any).gastosOperacionais || (orc as any).gastos || {};
      const gastosOp = (g.transporte || 0) + (g.alimentacao || 0) + (g.hospedagem || 0) + (g.outros || 0);
      const mao = (orc as any).cobrancaMaoDeObra?.subtotalMaoDeObra || (orc as any).custoMaoDeObra || 0;
      const desloc = (orc as any).custoDeslocamento || 0;
      return gastosOp + mao + desloc;
    })(),
    desconto: (orc as any).desconto,
    valorSubtotal: (orc as any).valorSubtotal || (orc.valorTotal || 0),
    valorDesconto: (orc as any).valorDesconto || 0,
  });
  await printOrSave(html, `orcamento-${orc.id?.slice(0, 8) || Date.now()}.pdf`, `Orçamento - ${cliente?.nome || orc.clienteNome}`);
}

export async function generateOSPDF(data: OSPDFData): Promise<void> {
  const os = data.os as any;
  const cliente = data.cliente;
  const empresa = data.empresa;
  const equipPrincipal = os.equipamentos?.[0] || {};

  // Verifica se equipamentos[] tem o NOVO formato (com problema/diagnostico/status individuais)
  const equipamentosComProblema = (os.equipamentos || []).filter((e: any) => e && (e.problema !== undefined || e.diagnostico !== undefined || e.status !== undefined));
  const usarFormatoNovo = equipamentosComProblema.length > 0;

  const html = await buildPDFHTML({
    tipo: "ORDEM DE SERVIÇO",
    codigo: (os.numero || os.codigo || os.id?.slice(0, 8) || "0").toString().padStart(4, "0"),
    status: os.status || "aberto",
    dataEmissao: os.dataCriacao || os.dataAbertura || os.criadoEm || new Date().toISOString(),
    empresa,
    clienteNome: cliente?.nome || os.clienteNome || "—",
    clienteTelefone: cliente?.telefone,
    equipamento: data.equipamento || os.equipamento || os.equipamentoDesc || equipPrincipal.tipo || (usarFormatoNovo ? `${equipamentosComProblema.length} equipamento(s)` : "—"),
    marcaModelo: usarFormatoNovo ? "Ver detalhes abaixo" : ([data.marca || os.marca || equipPrincipal.marca, data.modelo || os.modelo || equipPrincipal.modelo].filter(Boolean).join(" / ") || "—"),
    local: data.local || os.local,
    tecnico: data.tecnico || os.tecnicoResponsavel || (empresa as any)?.tecnicoResponsavel,
    problema: usarFormatoNovo ? "" : (os.problema || ""),
    defeitos: os.defeitosEncontrados || os.defeitos || "",
    diagnostico: usarFormatoNovo ? "" : (os.diagnostico || os.solucao || ""),
    observacaoTecnica: os.observacaoTecnica || os.observacoes || "",
    itens: os.servicos || os.itens || [],
    materiais: os.materiais || [],
    valorTotal: os.valorTotal || 0,
    equipamentosLista: usarFormatoNovo ? equipamentosComProblema : undefined,
    extrasOperacionais: ((os as any).custoDeslocamento || 0) + ((os as any).custoMaoDeObra || 0),
  });
  await printOrSave(html, `os-${os.numero || os.id?.slice(0, 8) || Date.now()}.pdf`, `OS - ${cliente?.nome || os.clienteNome}`);
}

export async function gerarReciboPDF(data: ReciboPagamentoData): Promise<void> {
  const empresa: any = {
    nome: data.empresaNome || "Polar Soluções",
    cnpj: data.empresaCNPJ,
    telefone: data.empresaTelefone,
  };
  const html = await buildPDFHTML({
    tipo: "RECIBO",
    codigo: data.id.replace(/-/g, "").slice(0, 6).toUpperCase(),
    status: "pago",
    dataEmissao: data.dataPagamento,
    empresa,
    clienteNome: data.clienteNome,
    clienteTelefone: data.clienteTelefone,
    equipamento: "Serviços Prestados",
    marcaModelo: data.metodoPagamento,
    tecnico: "",
    diagnostico: data.descricao,
    observacaoTecnica: data.observacoes,
    itens: [{ id: "1", descricao: data.descricao, quantidade: 1, valor: data.valorPago } as any],
    materiais: [],
    valorTotal: data.valorPago,
    labelValor: "VALOR RECEBIDO",
  });
  await printOrSave(html, `recibo-${data.id.slice(0, 8)}.pdf`, `Recibo - ${data.clienteNome}`);
}

export async function gerarRelatorioPDF(titulo: string, conteudoMarkdown: string, empresa: EmpresaConfig | null): Promise<void> {
  // Converte markdown simples para HTML
  const html_content = conteudoMarkdown
    .replace(/^### (.+)$/gm, '<h3 style="color:#0D3B66;font-size:14px;font-weight:800;margin:14px 0 6px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#0D3B66;font-size:17px;font-weight:900;margin:18px 0 8px;border-bottom:2px solid #1E88E5;padding-bottom:4px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#0D3B66;font-size:20px;font-weight:900;margin:20px 0 10px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0D3B66;">$1</strong>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin-bottom:4px;">$1</li>')
    .replace(/\n\n/g, "</p><p style='margin:8px 0;line-height:1.6;'>")
    .replace(/^(?!<[hlu]|<\/p)(.+)$/gm, "<p style='margin:6px 0;line-height:1.6;'>$1</p>");

  const conteudoCustom = `
    <div style="background:#fff; border:1px solid #E2E8F0; border-radius:10px; padding:18px 22px; margin-top:8px;">
      <div style="font-size:18px; font-weight:900; color:#0D3B66; margin-bottom:6px; letter-spacing:-0.3px;">${titulo}</div>
      <div style="font-size:10px; color:#64748B; margin-bottom:14px;">Gerado em ${new Date().toLocaleString("pt-BR")} • Powered by Claude Sonnet 4.5</div>
      <div style="font-size:10px; color:#2D3748;">${html_content}</div>
    </div>`;

  const html = await buildPDFHTML({
    tipo: "RELATÓRIO",
    codigo: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    status: "concluido",
    dataEmissao: new Date().toISOString(),
    empresa,
    clienteNome: "Análise Executiva",
    equipamento: "",
    marcaModelo: "",
    valorTotal: 0,
    conteudoCustom,
  });
  await printOrSave(html, `relatorio-${Date.now()}.pdf`, titulo);
}

// ─────────────────────────────────────────────────────────
// PRINT/SHARE helper unificado
// ─────────────────────────────────────────────────────────
async function printOrSave(html: string, filename: string, dialogTitle: string) {
  try {
    if (Platform.OS === "web") {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        newWindow.print();
      }
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    if (Sharing?.shareAsync) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle, UTI: "com.adobe.pdf" });
    }
  } catch (error) {
    console.error("[PDF] Erro:", error);
    throw error;
  }
}
