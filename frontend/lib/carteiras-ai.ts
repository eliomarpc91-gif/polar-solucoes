/**
 * Análise inteligente das carteiras financeiras (offline).
 * Gera insights sobre distribuição, saldos, padrões de entrada/saída e previsões.
 */
import { Carteira, MovimentacaoCarteira } from "./store";

export interface CarteiraInsight {
  tipo: "critico" | "atencao" | "info" | "sucesso";
  titulo: string;
  mensagem: string;
  icone: string;
}

export interface CarteirasStats {
  saldoTotal: number;
  totalEntradasMes: number;
  totalSaidasMes: number;
  fluxoLiquidoMes: number;
  diasParaZerar?: number;
  carteiraMaisAtiva?: string;
  carteiraMaiorSaldo?: string;
  carteiraMaisBaixa?: string;
  insights: CarteiraInsight[];
  serieMensal: { mes: string; entradas: number; saidas: number; saldoFinal: number }[];
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function analisarCarteiras(
  carteiras: Carteira[],
  movs: MovimentacaoCarteira[],
): CarteirasStats {
  const insights: CarteiraInsight[] = [];
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);

  const ativas = carteiras.filter((c) => c.ativa);
  const saldoTotal = carteiras.reduce((s, c) => s + (c.saldo || 0), 0);

  // Movimentações do mês atual
  const movsMes = movs.filter((m) => new Date(m.data) >= inicioMes);
  const totalEntradasMes = movsMes
    .filter((m) => m.tipo === "entrada" || m.tipo === "transferencia_entrada")
    .reduce((s, m) => s + m.valor, 0);
  const totalSaidasMes = movsMes
    .filter((m) => m.tipo === "saida" || m.tipo === "transferencia_saida")
    .reduce((s, m) => s + m.valor, 0);
  const fluxoLiquidoMes = totalEntradasMes - totalSaidasMes;

  // Por carteira
  const porCarteira: Record<string, { entradas: number; saidas: number; qtdMov: number }> = {};
  for (const m of movs) {
    if (!porCarteira[m.carteiraId]) porCarteira[m.carteiraId] = { entradas: 0, saidas: 0, qtdMov: 0 };
    porCarteira[m.carteiraId].qtdMov += 1;
    if (m.tipo === "entrada" || m.tipo === "transferencia_entrada") porCarteira[m.carteiraId].entradas += m.valor;
    else porCarteira[m.carteiraId].saidas += m.valor;
  }

  // Ranking
  let maisAtiva: string | undefined;
  let maxMov = 0;
  Object.entries(porCarteira).forEach(([cid, d]) => {
    if (d.qtdMov > maxMov) {
      maxMov = d.qtdMov;
      const c = carteiras.find((cc) => cc.id === cid);
      maisAtiva = c?.nome;
    }
  });
  const maiorSaldoC = [...carteiras].sort((a, b) => b.saldo - a.saldo)[0];
  const menorSaldoC = ativas.length
    ? [...ativas].sort((a, b) => a.saldo - b.saldo)[0]
    : undefined;

  // Dias para zerar (com base no fluxo médio diário do mês)
  let diasParaZerar: number | undefined;
  if (fluxoLiquidoMes < 0 && saldoTotal > 0) {
    const diasMes = (hoje.getTime() - inicioMes.getTime()) / 86400000 + 1;
    const fluxoDiario = fluxoLiquidoMes / diasMes;
    if (fluxoDiario < 0) {
      diasParaZerar = Math.floor(saldoTotal / -fluxoDiario);
    }
  }

  // ─── INSIGHTS ────────────────────────────────────────────────────
  // 1) Sem carteira ativa
  if (ativas.length === 0) {
    insights.push({
      tipo: "atencao",
      titulo: "Nenhuma carteira ativa",
      mensagem: "Crie carteiras (Operacional, Impostos, Pró-labore, Reserva) para distribuir suas entradas automaticamente.",
      icone: "account-balance-wallet",
    });
  } else {
    const somaPct = ativas.reduce((s, c) => s + (c.percentual || 0), 0);
    if (Math.abs(somaPct - 100) > 0.5) {
      insights.push({
        tipo: "critico",
        titulo: `Distribuição em ${somaPct.toFixed(1)}%`,
        mensagem: `A soma dos percentuais das carteiras ativas deve ser 100%. Ajuste para evitar perdas ou sobras na divisão.`,
        icone: "pie-chart",
      });
    } else {
      insights.push({
        tipo: "sucesso",
        titulo: "Distribuição balanceada",
        mensagem: "As carteiras ativas somam exatamente 100% — entradas serão divididas corretamente.",
        icone: "check-circle",
      });
    }
  }

  // 2) Saldo baixo
  for (const c of ativas) {
    const minimo = c.saldoMinimo || 0;
    if (minimo > 0 && c.saldo < minimo) {
      insights.push({
        tipo: "critico",
        titulo: `${c.nome}: saldo abaixo do mínimo`,
        mensagem: `Saldo R$ ${c.saldo.toFixed(2)} está abaixo do limite (R$ ${minimo.toFixed(2)}). Considere transferir.`,
        icone: "warning",
      });
    }
  }

  // 3) Fluxo negativo
  if (fluxoLiquidoMes < 0) {
    insights.push({
      tipo: "atencao",
      titulo: `Fluxo negativo este mês: R$ ${fluxoLiquidoMes.toFixed(2)}`,
      mensagem: "As saídas superaram as entradas neste mês. Avalie cortar despesas ou aumentar entradas.",
      icone: "trending-down",
    });
  } else if (fluxoLiquidoMes > 0) {
    insights.push({
      tipo: "sucesso",
      titulo: `Fluxo positivo: R$ ${fluxoLiquidoMes.toFixed(2)}`,
      mensagem: "Você está guardando dinheiro este mês. Considere reforçar a carteira Reserva.",
      icone: "trending-up",
    });
  }

  // 4) Previsão de falta de caixa
  if (diasParaZerar !== undefined && diasParaZerar < 30) {
    insights.push({
      tipo: "critico",
      titulo: `Caixa pode zerar em ${diasParaZerar} dias`,
      mensagem: "No ritmo atual de saídas, o saldo total acaba antes do fim do mês. Tome ações imediatas.",
      icone: "hourglass-empty",
    });
  }

  // 5) Sugestão de ajuste
  if (ativas.length >= 2) {
    const ranking = ativas
      .map((c) => ({
        c,
        crescimento: (porCarteira[c.id]?.entradas || 0) - (porCarteira[c.id]?.saidas || 0),
      }))
      .sort((a, b) => b.crescimento - a.crescimento);
    const melhor = ranking[0];
    const pior = ranking[ranking.length - 1];
    if (melhor.crescimento > 0 && pior.crescimento < 0 && melhor.c.id !== pior.c.id) {
      insights.push({
        tipo: "info",
        titulo: `Sugestão: rebalancear ${pior.c.nome}→${melhor.c.nome}`,
        mensagem: `${melhor.c.nome} cresceu R$ ${melhor.crescimento.toFixed(2)} enquanto ${pior.c.nome} perdeu R$ ${(-pior.crescimento).toFixed(2)}. Considere transferir.`,
        icone: "swap-horiz",
      });
    }
  }

  // ─── Série mensal (últimos 6 meses) ───────────────────────────────
  const serieMensal: { mes: string; entradas: number; saidas: number; saldoFinal: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
    const movsMes = movs.filter((m) => {
      const d = new Date(m.data);
      return d >= ref && d < fim;
    });
    const e = movsMes.filter((m) => m.tipo === "entrada" || m.tipo === "transferencia_entrada").reduce((s, m) => s + m.valor, 0);
    const s = movsMes.filter((m) => m.tipo === "saida" || m.tipo === "transferencia_saida").reduce((s, m) => s + m.valor, 0);
    serieMensal.push({
      mes: ref.toLocaleString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
      entradas: Math.round(e * 100) / 100,
      saidas: Math.round(s * 100) / 100,
      saldoFinal: 0,
    });
  }
  // Calcula saldo acumulado
  let acc = 0;
  for (const m of serieMensal) {
    acc += m.entradas - m.saidas;
    m.saldoFinal = Math.round(acc * 100) / 100;
  }

  return {
    saldoTotal,
    totalEntradasMes,
    totalSaidasMes,
    fluxoLiquidoMes,
    diasParaZerar,
    carteiraMaisAtiva: maisAtiva,
    carteiraMaiorSaldo: maiorSaldoC?.nome,
    carteiraMaisBaixa: menorSaldoC?.nome,
    insights,
    serieMensal,
  };
}
