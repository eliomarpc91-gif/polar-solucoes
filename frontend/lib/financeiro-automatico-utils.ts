/**
 * Utilities para o módulo financeiro automático
 * Lógica de entradas automáticas, cálculos, filtros
 */

import {
  EntradaFinanceira,
  SaidaFinanceira,
  ResumenFinanceiroMes,
  FiltrosFinanceiros,
  TransacaoConsolidada,
  StatusFinanceiro,
} from "./financeiro-automatico-types";

// ========== CRIAÇÃO DE ENTRADAS AUTOMÁTICAS ==========

/**
 * Cria uma entrada automática ao aprovar um orçamento
 * Se entrada de 50%, registra apenas o valor recebido
 * O restante fica como "contas a receber"
 */
export function criarEntradaOrcamentoAprovado(
  orcamentoId: string,
  clienteId: string,
  clienteNome: string,
  valorTotal: number,
  percentualEntrada: number = 50,
  formaPagamento: string = "pix"
): EntradaFinanceira {
  const valorRecebido = (valorTotal * percentualEntrada) / 100;
  const valorPendente = valorTotal - valorRecebido;

  return {
    id: `entrada_${orcamentoId}_${Date.now()}`,
    data: new Date().toISOString().split("T")[0],
    clienteId,
    clienteNome,
    orcamentoId,
    descricao: `Orçamento aprovado - 50% de entrada`,
    categoria: "servico",
    valorTotal,
    valorRecebido,
    valorPendente,
    formaPagamento: formaPagamento as any,
    status: valorPendente > 0 ? "parcial" : "pago",
    observacoes: `Entrada de ${percentualEntrada}% recebida. Saldo de R$ ${valorPendente.toFixed(2)} pendente.`,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    origem: "orcamento",
  };
}

/**
 * Cria uma entrada automática ao finalizar uma OS
 * Registra o valor restante como "pendente de recebimento"
 */
export function criarEntradaOSFinalizada(
  osId: string,
  clienteId: string,
  clienteNome: string,
  valorTotal: number,
  valorJaRecebido: number = 0,
  formaPagamento: string = "pix"
): EntradaFinanceira {
  const valorPendente = valorTotal - valorJaRecebido;

  return {
    id: `entrada_${osId}_${Date.now()}`,
    data: new Date().toISOString().split("T")[0],
    clienteId,
    clienteNome,
    osId,
    descricao: `OS finalizada - Pendente de recebimento`,
    categoria: "servico",
    valorTotal,
    valorRecebido: valorJaRecebido,
    valorPendente,
    formaPagamento: formaPagamento as any,
    status: valorJaRecebido > 0 ? "parcial" : "pendente",
    observacoes: `Valor total: R$ ${valorTotal.toFixed(2)}. Já recebido: R$ ${valorJaRecebido.toFixed(2)}. Pendente: R$ ${valorPendente.toFixed(2)}.`,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    origem: "os",
  };
}

/**
 * Atualiza uma entrada ao receber pagamento parcial
 */
export function atualizarEntradaPagamentoParcial(
  entrada: EntradaFinanceira,
  valorRecebidoAgora: number
): EntradaFinanceira {
  const novoValorRecebido = entrada.valorRecebido + valorRecebidoAgora;
  const novoValorPendente = entrada.valorTotal - novoValorRecebido;

  return {
    ...entrada,
    valorRecebido: novoValorRecebido,
    valorPendente: Math.max(0, novoValorPendente),
    status:
      novoValorPendente <= 0
        ? "pago"
        : novoValorRecebido > 0
          ? "parcial"
          : "pendente",
    atualizado_em: new Date().toISOString(),
  };
}

/**
 * Verifica se já existe uma entrada para um orçamento/OS
 * Evita duplicação
 */
export function verificarDuplicacaoEntrada(
  entradas: EntradaFinanceira[],
  orcamentoId?: string,
  osId?: string
): boolean {
  if (orcamentoId) {
    return entradas.some((e) => e.orcamentoId === orcamentoId);
  }
  if (osId) {
    return entradas.some((e) => e.osId === osId);
  }
  return false;
}

// ========== CÁLCULOS FINANCEIROS ==========

/**
 * Calcula o resumo financeiro de um mês
 */
export function calcularResumenMes(
  entradas: EntradaFinanceira[],
  saidas: SaidaFinanceira[],
  mes: number,
  ano: number
): ResumenFinanceiroMes {
  const dataInicio = new Date(ano, mes - 1, 1).toISOString().split("T")[0];
  const dataFim = new Date(ano, mes, 0).toISOString().split("T")[0];

  const entradasMes = entradas.filter(
    (e) => e.data >= dataInicio && e.data <= dataFim
  );
  const saidasMes = saidas.filter(
    (s) => s.data >= dataInicio && s.data <= dataFim
  );

  const totalEntradas = entradasMes.reduce((sum, e) => sum + e.valorRecebido, 0);
  const totalSaidas = saidasMes.reduce((sum, s) => sum + s.valor, 0);
  const lucroLiquido = totalEntradas - totalSaidas;

  const contasAReceber = entradasMes.reduce((sum, e) => sum + e.valorPendente, 0);
  const contasPagas = entradasMes.filter((e) => e.status === "pago").length;
  const contasPendentes = entradasMes.filter(
    (e) => e.status === "pendente" || e.status === "parcial"
  ).length;

  const orcamentosAprovados = entradasMes.filter(
    (e) => e.origem === "orcamento"
  ).length;
  const osFinalizadas = entradasMes.filter((e) => e.origem === "os").length;

  return {
    mes,
    ano,
    totalEntradas,
    totalSaidas,
    lucroLiquido,
    contasAReceber,
    contasPagas,
    contasPendentes,
    orcamentosAprovados,
    osFinalizadas,
    entradas: entradasMes,
    saidas: saidasMes,
  };
}

/**
 * Calcula o lucro líquido (entradas - saídas)
 */
export function calcularLucroLiquido(
  totalEntradas: number,
  totalSaidas: number
): number {
  return totalEntradas - totalSaidas;
}

// ========== FILTROS ==========

/**
 * Filtra entradas financeiras de acordo com critérios
 */
export function filtrarEntradas(
  entradas: EntradaFinanceira[],
  filtros: FiltrosFinanceiros
): EntradaFinanceira[] {
  let resultado = [...entradas];

  // Filtro por período
  if (filtros.dataInicio && filtros.dataFim) {
    resultado = resultado.filter(
      (e) => e.data >= filtros.dataInicio! && e.data <= filtros.dataFim!
    );
  }

  // Filtro por cliente
  if (filtros.clienteId) {
    resultado = resultado.filter((e) => e.clienteId === filtros.clienteId);
  }

  // Filtro por categoria
  if (filtros.categoria) {
    resultado = resultado.filter((e) => e.categoria === filtros.categoria);
  }

  // Filtro por status
  if (filtros.status) {
    resultado = resultado.filter((e) => e.status === filtros.status);
  }

  // Filtro por forma de pagamento
  if (filtros.formaPagamento) {
    resultado = resultado.filter(
      (e) => e.formaPagamento === filtros.formaPagamento
    );
  }

  // Busca por descrição/cliente
  if (filtros.busca) {
    const busca = filtros.busca.toLowerCase();
    resultado = resultado.filter(
      (e) =>
        e.descricao.toLowerCase().includes(busca) ||
        e.clienteNome.toLowerCase().includes(busca)
    );
  }

  return resultado;
}

/**
 * Filtra saídas financeiras de acordo com critérios
 */
export function filtrarSaidas(
  saidas: SaidaFinanceira[],
  filtros: FiltrosFinanceiros
): SaidaFinanceira[] {
  let resultado = [...saidas];

  // Filtro por período
  if (filtros.dataInicio && filtros.dataFim) {
    resultado = resultado.filter(
      (s) => s.data >= filtros.dataInicio! && s.data <= filtros.dataFim!
    );
  }

  // Filtro por categoria
  if (filtros.categoria) {
    resultado = resultado.filter((s) => s.categoria === filtros.categoria);
  }

  // Filtro por forma de pagamento
  if (filtros.formaPagamento) {
    resultado = resultado.filter(
      (s) => s.formaPagamento === filtros.formaPagamento
    );
  }

  // Busca por descrição/fornecedor
  if (filtros.busca) {
    const busca = filtros.busca.toLowerCase();
    resultado = resultado.filter(
      (s) =>
        s.descricao.toLowerCase().includes(busca) ||
        (s.fornecedor && s.fornecedor.toLowerCase().includes(busca))
    );
  }

  return resultado;
}

// ========== CONSOLIDAÇÃO DE TRANSAÇÕES ==========

/**
 * Consolida entradas e saídas em uma lista única ordenada por data
 * Calcula saldo acumulado
 */
export function consolidarTransacoes(
  entradas: EntradaFinanceira[],
  saidas: SaidaFinanceira[]
): TransacaoConsolidada[] {
  const transacoes: TransacaoConsolidada[] = [];

  // Adicionar entradas
  entradas.forEach((e) => {
    transacoes.push({
      id: e.id,
      data: e.data,
      tipo: "entrada",
      descricao: e.descricao,
      valor: e.valorRecebido,
      saldo: 0, // será calculado depois
      categoria: e.categoria,
      status: e.status,
      clienteNome: e.clienteNome,
      formaPagamento: e.formaPagamento,
    });
  });

  // Adicionar saídas
  saidas.forEach((s) => {
    transacoes.push({
      id: s.id,
      data: s.data,
      tipo: "saida",
      descricao: s.descricao,
      valor: -s.valor, // negativo para saída
      saldo: 0, // será calculado depois
      categoria: s.categoria,
      formaPagamento: s.formaPagamento,
    });
  });

  // Ordenar por data
  transacoes.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  // Calcular saldo acumulado
  let saldoAcumulado = 0;
  transacoes.forEach((t) => {
    saldoAcumulado += t.valor;
    t.saldo = saldoAcumulado;
  });

  return transacoes;
}

// ========== VALIDAÇÕES ==========

/**
 * Valida se uma entrada está completa
 */
export function validarEntrada(entrada: Partial<EntradaFinanceira>): string[] {
  const erros: string[] = [];

  if (!entrada.clienteId) erros.push("Cliente é obrigatório");
  if (!entrada.descricao) erros.push("Descrição é obrigatória");
  if (entrada.valorTotal === undefined || entrada.valorTotal <= 0)
    erros.push("Valor total deve ser maior que zero");
  if (!entrada.formaPagamento) erros.push("Forma de pagamento é obrigatória");
  if (!entrada.categoria) erros.push("Categoria é obrigatória");

  return erros;
}

/**
 * Valida se uma saída está completa
 */
export function validarSaida(saida: Partial<SaidaFinanceira>): string[] {
  const erros: string[] = [];

  if (!saida.descricao) erros.push("Descrição é obrigatória");
  if (saida.valor === undefined || saida.valor <= 0)
    erros.push("Valor deve ser maior que zero");
  if (!saida.formaPagamento) erros.push("Forma de pagamento é obrigatória");
  if (!saida.categoria) erros.push("Categoria é obrigatória");

  return erros;
}
