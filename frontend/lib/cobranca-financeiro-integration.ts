/**
 * Integração entre cobranças e financeiro automático
 */

import { Cobranca, StatusCobranca } from "./cobranca-types";
import { EntradaFinanceira } from "./financeiro-automatico-types";

/**
 * Converte uma cobrança em entrada financeira
 */
export function cobrancaParaEntradaFinanceira(cobranca: Cobranca): EntradaFinanceira {
  return {
    id: `entrada_cobranca_${cobranca.id}`,
    data: cobranca.dataCriacao,
    clienteId: cobranca.clienteId,
    clienteNome: cobranca.clienteNome,
    orcamentoId: cobranca.orcamentoId,
    osId: cobranca.osId,
    descricao: cobranca.descricao,
    categoria: "servico",
    valorTotal: cobranca.valorTotal,
    valorRecebido: cobranca.valorRecebido,
    valorPendente: cobranca.valorPendente,
    formaPagamento: cobranca.formaPagamento as any,
    status: mapearStatusCobrancaParaFinanceiro(cobranca.status),
    criado_em: cobranca.criado_em,
    atualizado_em: cobranca.atualizado_em,
    origem: "manual",
  };
}

/**
 * Mapeia status de cobrança para status financeiro
 */
function mapearStatusCobrancaParaFinanceiro(
  statusCobranca: StatusCobranca
): "pago" | "parcial" | "pendente" {
  switch (statusCobranca) {
    case "pago":
      return "pago";
    case "parcial":
      return "parcial";
    case "pendente":
    case "vencido":
    case "cancelado":
    default:
      return "pendente";
  }
}

/**
 * Atualiza status de cobrança baseado em pagamentos
 */
export function atualizarStatusCobranca(cobranca: Cobranca): StatusCobranca {
  if (cobranca.valorRecebido >= cobranca.valorTotal) {
    return "pago";
  }

  if (cobranca.valorRecebido > 0) {
    return "parcial";
  }

  // Verificar se está vencida
  const hoje = new Date();
  const vencimento = new Date(cobranca.dataVencimento);

  if (hoje > vencimento) {
    return "vencido";
  }

  return "pendente";
}

/**
 * Calcula juros e multa acumulados
 */
export function calcularJurosEMulta(
  cobranca: Cobranca,
  aplicarJuros: boolean = true,
  aplicarMulta: boolean = true
): { jurosAcumulado: number; multaAcumulada: number; valorTotal: number } {
  let jurosAcumulado = 0;
  let multaAcumulada = 0;

  const hoje = new Date();
  const vencimento = new Date(cobranca.dataVencimento);

  if (hoje > vencimento) {
    const diasVencidos = Math.floor(
      (hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (aplicarJuros && cobranca.juros > 0) {
      // Juros simples: (valor * taxa * dias) / 100 / 30
      jurosAcumulado = (cobranca.valorTotal * cobranca.juros * diasVencidos) / 100 / 30;
    }

    if (aplicarMulta && cobranca.multa > 0) {
      multaAcumulada = cobranca.multa;
    }
  }

  const valorTotal = cobranca.valorTotal + jurosAcumulado + multaAcumulada - cobranca.desconto;

  return {
    jurosAcumulado,
    multaAcumulada,
    valorTotal,
  };
}

/**
 * Registra um pagamento em uma cobrança
 */
export function registrarPagamentoCobranca(
  cobranca: Cobranca,
  valorPago: number
): Cobranca {
  const novoValorRecebido = Math.min(
    cobranca.valorRecebido + valorPago,
    cobranca.valorTotal
  );
  const novoValorPendente = cobranca.valorTotal - novoValorRecebido;

  return {
    ...cobranca,
    valorRecebido: novoValorRecebido,
    valorPendente: novoValorPendente,
    status: atualizarStatusCobranca({
      ...cobranca,
      valorRecebido: novoValorRecebido,
      valorPendente: novoValorPendente,
    }),
    dataPagamento:
      novoValorRecebido >= cobranca.valorTotal
        ? new Date().toISOString().split("T")[0]
        : cobranca.dataPagamento,
    atualizado_em: new Date().toISOString(),
  };
}

/**
 * Calcula resumo de cobranças para o dashboard
 */
export function calcularResumoCobrancas(cobrancas: Cobranca[]) {
  const hoje = new Date();

  let totalCobrancas = 0;
  let totalPendente = 0;
  let totalVencido = 0;
  let totalRecebido = 0;
  let cobrancasVencidas = 0;
  let cobrancasProximas = 0;

  cobrancas.forEach((cobranca) => {
    const vt = Number(cobranca.valorTotal) || 0;
    const vr = Number(cobranca.valorRecebido) || 0;
    // valorPendente nem sempre é preenchido em cobranças antigas — calcula como fallback
    const vp = Number(cobranca.valorPendente);
    const pendenteSeguro = Number.isFinite(vp) ? vp : Math.max(vt - vr, 0);

    totalCobrancas += vt;
    totalRecebido += vr;
    totalPendente += pendenteSeguro;

    if (cobranca.dataVencimento) {
      const vencimento = new Date(cobranca.dataVencimento);
      if (!isNaN(vencimento.getTime())) {
        const diasRestantes = Math.floor(
          (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasRestantes < 0 && cobranca.status !== "pago") {
          cobrancasVencidas++;
          totalVencido += pendenteSeguro;
        } else if (diasRestantes >= 0 && diasRestantes <= 7) {
          cobrancasProximas++;
        }
      }
    }
  });

  const percentualRecebimento =
    totalCobrancas > 0 ? (totalRecebido / totalCobrancas) * 100 : 0;

  return {
    totalCobrancas,
    totalPendente,
    totalVencido,
    totalRecebido,
    percentualRecebimento,
    cobrancasVencidas,
    cobrancasProximas,
  };
}

// Alias com cedilha para compatibilidade retro (NÃO usar em código novo — quebra na minificação Hermes)
export const calcularResumoCobranças = calcularResumoCobrancas;

/**
 * Filtra cobranças por critérios
 */
export function filtrarCobrancas(
  cobrancas: Cobranca[],
  filtros: {
    status?: StatusCobranca;
    clienteId?: string;
    dataInicio?: string;
    dataFim?: string;
    vencidas?: boolean;
    proximasVencer?: boolean;
  }
): Cobranca[] {
  const hoje = new Date();

  return cobrancas.filter((cobranca) => {
    // Filtro por status
    if (filtros.status && cobranca.status !== filtros.status) {
      return false;
    }

    // Filtro por cliente
    if (filtros.clienteId && cobranca.clienteId !== filtros.clienteId) {
      return false;
    }

    // Filtro por período
    if (filtros.dataInicio && cobranca.dataCriacao < filtros.dataInicio) {
      return false;
    }
    if (filtros.dataFim && cobranca.dataCriacao > filtros.dataFim) {
      return false;
    }

    // Filtro por vencidas
    if (filtros.vencidas) {
      const vencimento = new Date(cobranca.dataVencimento);
      if (vencimento >= hoje) {
        return false;
      }
    }

    // Filtro por próximas a vencer
    if (filtros.proximasVencer) {
      const vencimento = new Date(cobranca.dataVencimento);
      const diasRestantes = Math.floor(
        (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasRestantes < 0 || diasRestantes > 7) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Gera número sequencial para recibo
 */
export function gerarNumeroRecibo(cobrancas: Cobranca[]): string {
  const numero = cobrancas.length + 1;
  return `REC-${new Date().getFullYear()}-${String(numero).padStart(6, "0")}`;
}
