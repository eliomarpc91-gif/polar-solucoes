/**
 * Análise inteligente do histórico de um equipamento (offline).
 * Funciona 100% local. Gera alertas, recomendações e KPIs.
 */
import { OrdemServico } from "./store";

export interface EquipamentoInsight {
  tipo: "critico" | "atencao" | "info" | "sucesso";
  titulo: string;
  mensagem: string;
  icone: string;
}

export interface EquipamentoStats {
  totalOS: number;
  totalGasto: number;
  ticketMedio: number;
  ultimaManutencao?: string;
  diasDesdeUltima?: number;
  proximaPreventiva?: string;
  recorrenciaDefeitos: number; // OS no último ano
  insights: EquipamentoInsight[];
}

const DIAS_PREVENTIVA = 180; // 6 meses
const DIAS_RECORRENCIA = 90; // 3 meses

function diffDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function temPalavra(texto: string, palavras: string[]): boolean {
  const t = (texto || "").toLowerCase();
  return palavras.some((p) => t.includes(p));
}

export function analisarEquipamento(historicoOS: OrdemServico[]): EquipamentoStats {
  const insights: EquipamentoInsight[] = [];
  const hoje = new Date();

  // Ordena cronologicamente (mais recente primeiro)
  const oss = [...historicoOS].sort((a, b) => {
    const da = new Date((a as any).concluidoEm || a.atualizadoEm || a.criadoEm || "").getTime();
    const db = new Date((b as any).concluidoEm || b.atualizadoEm || b.criadoEm || "").getTime();
    return db - da;
  });

  const totalOS = oss.length;
  const totalGasto = oss.reduce((s, o) => s + ((o as any).valorTotal || 0), 0);
  const ticketMedio = totalOS > 0 ? totalGasto / totalOS : 0;

  // Última manutenção
  let ultimaManutencao: string | undefined;
  let diasDesdeUltima: number | undefined;
  if (oss[0]) {
    ultimaManutencao = (oss[0] as any).concluidoEm || oss[0].atualizadoEm || oss[0].criadoEm;
    if (ultimaManutencao) {
      diasDesdeUltima = diffDias(hoje, new Date(ultimaManutencao));
    }
  }

  // Próxima preventiva = última manutenção + 180 dias
  let proximaPreventiva: string | undefined;
  if (ultimaManutencao) {
    const d = new Date(ultimaManutencao);
    d.setDate(d.getDate() + DIAS_PREVENTIVA);
    proximaPreventiva = d.toISOString();
  }

  // Recorrência (OS nos últimos 12 meses)
  const umAnoAtras = new Date(hoje.getTime() - 365 * 86400000);
  const recorrenciaDefeitos = oss.filter((o) => {
    const d = new Date((o as any).concluidoEm || o.atualizadoEm || o.criadoEm || "");
    return d.getTime() >= umAnoAtras.getTime();
  }).length;

  // ─── INSIGHTS ──────────────────────────────────────────────────────

  // 1) Sem histórico
  if (totalOS === 0) {
    insights.push({
      tipo: "info",
      titulo: "Equipamento novo no sistema",
      mensagem: "Nenhuma ordem de serviço registrada para este equipamento ainda. Agende uma inspeção inicial.",
      icone: "new-releases",
    });
    return { totalOS, totalGasto, ticketMedio, ultimaManutencao, diasDesdeUltima, proximaPreventiva, recorrenciaDefeitos, insights };
  }

  // 2) Recorrência de defeitos
  if (recorrenciaDefeitos >= 4) {
    insights.push({
      tipo: "critico",
      titulo: `Alta recorrência de defeitos (${recorrenciaDefeitos} OS/ano)`,
      mensagem: "Equipamento apresenta falhas frequentes. Avalie a viabilidade técnica e econômica de substituição.",
      icone: "warning",
    });
  } else if (recorrenciaDefeitos >= 2) {
    insights.push({
      tipo: "atencao",
      titulo: `Recorrência moderada (${recorrenciaDefeitos} OS/ano)`,
      mensagem: "Considere uma manutenção preventiva mais profunda para evitar novos chamados.",
      icone: "info",
    });
  }

  // 3) Cargas de gás múltiplas → possível vazamento
  const cargasGas = oss.filter((o) => {
    const txt = `${o.problema || ""} ${o.diagnostico || ""} ${(o as any).observacaoTecnica || ""} ${(o.materiais || []).map((m) => m.descricao).join(" ")}`;
    return temPalavra(txt, ["gás", "gas", "carga de gás", "r410", "r22", "r600", "r134", "refrigerante"]);
  });
  if (cargasGas.length >= 2) {
    insights.push({
      tipo: "critico",
      titulo: `${cargasGas.length} cargas de gás detectadas`,
      mensagem: "Múltiplas cargas em curto período indicam possível vazamento. Inspeção do circuito frigorífico é crítica.",
      icone: "local-gas-station",
    });
  }

  // 4) Trocas frequentes de componentes (compressor, capacitor, placa)
  const componentes: Record<string, number> = {};
  for (const o of oss) {
    for (const m of o.materiais || []) {
      const nome = (m.descricao || "").toLowerCase();
      if (!nome) continue;
      // Detecta componentes principais
      const key = ["compressor", "capacitor", "placa", "termostato", "ventilador", "evaporador", "condensador"].find((p) => nome.includes(p));
      if (key) componentes[key] = (componentes[key] || 0) + 1;
    }
  }
  Object.entries(componentes).forEach(([comp, qtd]) => {
    if (qtd >= 2) {
      insights.push({
        tipo: "atencao",
        titulo: `${comp.charAt(0).toUpperCase() + comp.slice(1)} trocado ${qtd}x`,
        mensagem: `Histórico de múltiplas trocas de ${comp}. Verifique a causa raiz (sobrecarga, instalação, qualidade da peça).`,
        icone: "build",
      });
    }
  });

  // 5) Manutenção preventiva atrasada
  if (diasDesdeUltima !== undefined && diasDesdeUltima > DIAS_PREVENTIVA) {
    insights.push({
      tipo: "atencao",
      titulo: "Preventiva atrasada",
      mensagem: `Última manutenção há ${diasDesdeUltima} dias. Recomendado agendar inspeção preventiva.`,
      icone: "schedule",
    });
  } else if (diasDesdeUltima !== undefined && diasDesdeUltima > DIAS_PREVENTIVA - 30) {
    insights.push({
      tipo: "info",
      titulo: "Manutenção preventiva próxima",
      mensagem: `Próxima preventiva sugerida em ${DIAS_PREVENTIVA - diasDesdeUltima} dias.`,
      icone: "event-available",
    });
  }

  // 6) Custo acumulado vs custo de substituição
  if (totalGasto >= 3000) {
    insights.push({
      tipo: "atencao",
      titulo: `Custo acumulado alto: R$ ${totalGasto.toFixed(2)}`,
      mensagem: "Custo total de manutenção já supera R$ 3.000. Avalie ROI vs aquisição de equipamento novo.",
      icone: "monetization-on",
    });
  }

  // 7) Tudo OK
  if (insights.length === 0) {
    insights.push({
      tipo: "sucesso",
      titulo: "Equipamento em boas condições",
      mensagem: "Histórico estável, sem padrões de falha identificados. Continue com a manutenção regular.",
      icone: "check-circle",
    });
  }

  return {
    totalOS,
    totalGasto,
    ticketMedio,
    ultimaManutencao,
    diasDesdeUltima,
    proximaPreventiva,
    recorrenciaDefeitos,
    insights,
  };
}
