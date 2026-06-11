/**
 * Cálculo de rentabilidade local (offline-first).
 * Mirror exato da função _calcular_rentabilidade do backend (server.py).
 * Permite que a tela funcione mesmo sem internet ou se o backend falhar.
 */
import { OrdemServico } from "./store";

const HORA_RATE = 50.0; // R$/hora padrão de mão de obra
const DESLOCAMENTO_DEFAULT = 30.0;

export interface RentabilidadeData {
  kpis: {
    faturamentoTotal: number;
    custoTotal: number;
    lucroTotal: number;
    margemGlobal: number;
    qtdOSConcluidas: number;
    ticketMedio: number;
  };
  mes: {
    atual: { ref: string; faturamento: number; custo: number; lucro: number; qtd: number };
    anterior: { ref: string; faturamento: number; custo: number; lucro: number; qtd: number };
    crescimentoFat: number;
    crescimentoLucro: number;
  };
  rankingMaisRentaveis: any[];
  rankingMenosRentaveis: any[];
  evolucaoMensal: any[];
  sugestoesReajuste: any[];
  alertas: any[];
  detalhados: any[];
  insightIA?: string | null;
  modelo?: string;
  origem?: "online" | "offline";
}

function num(v: any, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function calcularRentabilidadeLocal(oss: OrdemServico[]): RentabilidadeData {
  const servicosAgreg: Record<string, { qtd: number; faturamento: number; custo: number; lucro: number; horas: number }> = {};
  const porMes: Record<string, { faturamento: number; custo: number; lucro: number; qtd: number }> = {};
  const detalhados: any[] = [];

  for (const o of oss) {
    const status = String((o as any).status || "").toLowerCase();
    if (status !== "concluido" && status !== "concluida") continue;

    const valor = num((o as any).valorTotal);
    let custoMaterial = 0;
    const materiais = (o as any).materiais || [];
    for (const m of materiais) {
      custoMaterial += num(m.valorUnitario) * num(m.quantidade);
      custoMaterial += num(m.frete);
    }
    const custoDesloc = num((o as any).custoDeslocamento, valor > 0 ? DESLOCAMENTO_DEFAULT : 0);
    const horas = num((o as any).horasTrabalhadas, 1);
    const custoMao = num((o as any).custoMaoDeObra) || horas * HORA_RATE;
    const custoTotal = custoMaterial + custoDesloc + custoMao;
    const lucro = valor - custoTotal;
    const margem = valor > 0 ? (lucro / valor) * 100 : 0;
    const lucroPorHora = horas > 0 ? lucro / horas : 0;
    const tipoServico = (o as any).tipoServico || (o as any).categoria || "Outros";

    detalhados.push({
      id: (o as any).id,
      numero: (o as any).numero || (o as any).codigo,
      cliente: (o as any).clienteNome,
      servico: tipoServico,
      valor: round(valor),
      custoMaterial: round(custoMaterial),
      custoDeslocamento: round(custoDesloc),
      custoMaoDeObra: round(custoMao),
      horasTrabalhadas: horas,
      lucroLiquido: round(lucro),
      margemPercentual: round(margem),
      lucroPorHora: round(lucroPorHora),
      dataConclusao: (o as any).concluidoEm || (o as any).dataConclusao || (o as any).atualizadoEm,
    });

    if (!servicosAgreg[tipoServico]) {
      servicosAgreg[tipoServico] = { qtd: 0, faturamento: 0, custo: 0, lucro: 0, horas: 0 };
    }
    servicosAgreg[tipoServico].qtd += 1;
    servicosAgreg[tipoServico].faturamento += valor;
    servicosAgreg[tipoServico].custo += custoTotal;
    servicosAgreg[tipoServico].lucro += lucro;
    servicosAgreg[tipoServico].horas += horas;

    const dataStr = String((o as any).concluidoEm || (o as any).dataConclusao || (o as any).atualizadoEm || "").slice(0, 7);
    if (dataStr) {
      if (!porMes[dataStr]) porMes[dataStr] = { faturamento: 0, custo: 0, lucro: 0, qtd: 0 };
      porMes[dataStr].faturamento += valor;
      porMes[dataStr].custo += custoTotal;
      porMes[dataStr].lucro += lucro;
      porMes[dataStr].qtd += 1;
    }
  }

  // Rankings
  const ranking = Object.entries(servicosAgreg).sort((a, b) => b[1].lucro - a[1].lucro);
  const mapServico = (entry: [string, any]) => {
    const [servico, v] = entry;
    const margem = v.faturamento > 0 ? (v.lucro / v.faturamento) * 100 : 0;
    return {
      servico,
      qtd: v.qtd,
      faturamento: round(v.faturamento),
      custo: round(v.custo),
      lucro: round(v.lucro),
      horas: round(v.horas),
      margem: round(margem),
    };
  };
  const maisRentaveis = ranking.slice(0, 5).map(mapServico);
  const menosRentaveis = [...ranking].reverse().slice(0, 5).map(mapServico);

  // Totais
  const totalFat = Object.values(servicosAgreg).reduce((s, x) => s + x.faturamento, 0);
  const totalCusto = Object.values(servicosAgreg).reduce((s, x) => s + x.custo, 0);
  const totalLucro = totalFat - totalCusto;
  const margemGlobal = totalFat > 0 ? (totalLucro / totalFat) * 100 : 0;
  const qtdOS = Object.values(servicosAgreg).reduce((s, x) => s + x.qtd, 0);

  // Mês atual vs anterior
  const hoje = new Date();
  const mesAtual = `${hoje.getUTCFullYear()}-${String(hoje.getUTCMonth() + 1).padStart(2, "0")}`;
  const ano = hoje.getUTCFullYear();
  const mesN = hoje.getUTCMonth() + 1;
  const mesAntN = mesN > 1 ? mesN - 1 : 12;
  const anoAnt = mesN > 1 ? ano : ano - 1;
  const mesAnterior = `${anoAnt}-${String(mesAntN).padStart(2, "0")}`;

  const dadosMes = porMes[mesAtual] || { faturamento: 0, custo: 0, lucro: 0, qtd: 0 };
  const dadosMesAnt = porMes[mesAnterior] || { faturamento: 0, custo: 0, lucro: 0, qtd: 0 };

  // Sugestões de reajuste
  const sugestoes: any[] = [];
  for (const [servico, v] of Object.entries(servicosAgreg)) {
    const margem = v.faturamento > 0 ? (v.lucro / v.faturamento) * 100 : 0;
    if (margem < 25 && v.qtd >= 1) {
      const reajuste = Math.max(15, Math.round(30 - margem));
      sugestoes.push({
        servico,
        margemAtual: round(margem),
        reajusteSugerido: reajuste,
        novoPreco: round((v.faturamento / v.qtd) * (1 + reajuste / 100)),
        qtd: v.qtd,
      });
    }
  }

  // Alertas
  const alertas: any[] = [];
  for (const [servico, v] of Object.entries(servicosAgreg)) {
    const margem = v.faturamento > 0 ? (v.lucro / v.faturamento) * 100 : 0;
    if (margem < 10 && v.qtd >= 1) {
      alertas.push({ tipo: "critico", servico, msg: `Margem crítica de ${margem.toFixed(1)}%` });
    } else if (margem < 25) {
      alertas.push({ tipo: "atencao", servico, msg: `Margem baixa de ${margem.toFixed(1)}%` });
    }
  }

  return {
    kpis: {
      faturamentoTotal: round(totalFat),
      custoTotal: round(totalCusto),
      lucroTotal: round(totalLucro),
      margemGlobal: round(margemGlobal),
      qtdOSConcluidas: qtdOS,
      ticketMedio: qtdOS > 0 ? round(totalFat / qtdOS) : 0,
    },
    mes: {
      atual: { ref: mesAtual, faturamento: round(dadosMes.faturamento), custo: round(dadosMes.custo), lucro: round(dadosMes.lucro), qtd: dadosMes.qtd },
      anterior: { ref: mesAnterior, faturamento: round(dadosMesAnt.faturamento), custo: round(dadosMesAnt.custo), lucro: round(dadosMesAnt.lucro), qtd: dadosMesAnt.qtd },
      crescimentoFat: round(dadosMesAnt.faturamento > 0 ? ((dadosMes.faturamento - dadosMesAnt.faturamento) / dadosMesAnt.faturamento) * 100 : 0),
      crescimentoLucro: round(dadosMesAnt.lucro > 0 ? ((dadosMes.lucro - dadosMesAnt.lucro) / dadosMesAnt.lucro) * 100 : 0),
    },
    rankingMaisRentaveis: maisRentaveis,
    rankingMenosRentaveis: menosRentaveis,
    evolucaoMensal: Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, v]) => ({ mes, faturamento: round(v.faturamento), custo: round(v.custo), lucro: round(v.lucro), qtd: v.qtd })),
    sugestoesReajuste: sugestoes.slice(0, 5),
    alertas: alertas.slice(0, 10),
    detalhados: detalhados.slice(0, 50),
    origem: "offline",
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
