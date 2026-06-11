/**
 * Utilitários para cálculo e processamento de orçamentos
 */

import { ServicoItem, MaterialItem, GastosOperacionais, Orcamento } from "./store";

/**
 * Calcula o valor total de gastos operacionais
 */
export function calcularTotalGastosOperacionais(gastos: GastosOperacionais): number {
  return gastos.transporte + gastos.alimentacao + gastos.hospedagem + gastos.outros;
}

/**
 * Calcula o valor de cada serviço (sem diluição de gastos)
 */
export function calcularValorServico(item: ServicoItem): number {
  return item.valor * item.quantidade;
}

/**
 * Calcula o valor total de serviços
 */
export function calcularTotalServicos(itens: ServicoItem[]): number {
  return itens.reduce((sum, item) => sum + calcularValorServico(item), 0);
}

/**
 * Calcula o valor de um material com lucro e frete
 */
export function calcularValorMaterial(material: MaterialItem): number {
  const base = material.valorUnitario * material.quantidade;
  const lucro = base * (material.lucroPercent / 100);
  return base + lucro + material.frete;
}

/**
 * Calcula o valor total de materiais
 */
export function calcularTotalMateriais(materiais: MaterialItem[]): number {
  return materiais.reduce((sum, material) => sum + calcularValorMaterial(material), 0);
}

/**
 * Calcula a proporção de cada serviço em relação ao total de serviços
 * Retorna um array com a proporção de cada serviço (0-1)
 */
export function calcularProporcoesServicos(itens: ServicoItem[]): number[] {
  const totalServicos = calcularTotalServicos(itens);
  
  if (totalServicos === 0) {
    return itens.map(() => 0);
  }
  
  return itens.map(item => calcularValorServico(item) / totalServicos);
}

/**
 * Distribui o gasto operacional proporcionalmente entre os serviços
 * Retorna um array com o valor de gasto alocado para cada serviço
 */
export function distribuirGastosOperacionais(
  itens: ServicoItem[],
  gastosOperacionais: GastosOperacionais
): number[] {
  const totalGastos = calcularTotalGastosOperacionais(gastosOperacionais);
  const proporcoes = calcularProporcoesServicos(itens);
  
  return proporcoes.map(proporcao => totalGastos * proporcao);
}

/**
 * Calcula o valor de um serviço com gasto operacional diluído
 */
export function calcularValorServicoComGastos(
  item: ServicoItem,
  gastosAlocados: number
): number {
  return calcularValorServico(item) + gastosAlocados;
}

/**
 * Calcula o valor total do orçamento
 * Nota: Gastos operacionais são distribuídos nos serviços, não somados ao total
 */
export function calcularValorTotalOrcamento(
  itens: ServicoItem[],
  materiais: MaterialItem[],
  gastosOperacionais: GastosOperacionais,
  valorMaoDeObra: number = 0
): number {
  const valorServicos = calcularTotalServicos(itens);
  const valorMateriais = calcularTotalMateriais(materiais);
  const valorGastos = calcularTotalGastosOperacionais(gastosOperacionais);
  
  // Gastos operacionais são distribuídos proporcionalmente nos serviços
  // Portanto, o total é: serviços (com gastos diluídos) + materiais + mão de obra
  return valorServicos + valorGastos + valorMateriais + valorMaoDeObra;
}

/**
 * Cria uma versão do orçamento com gastos operacionais diluídos nos serviços
 * Modifica os valores dos itens para incluir a proporção de gastos
 */
export function diluirGastosNoServicos(orcamento: Orcamento): Orcamento {
  const gastosAlocados = distribuirGastosOperacionais(
    orcamento.itens,
    orcamento.gastosOperacionais
  );
  
  const itensComGastos = orcamento.itens.map((item, index) => ({
    ...item,
    valor: item.valor + (gastosAlocados[index] / item.quantidade),
  }));
  
  return {
    ...orcamento,
    itens: itensComGastos,
  };
}

/**
 * Calcula o custo real dos materiais (sem lucro e frete)
 */
export function calcularCustoRealMateriais(materiais: MaterialItem[]): number {
  return materiais.reduce((sum, m) => sum + (m.valorUnitario * m.quantidade), 0);
}

/**
 * Calcula o lucro total dos materiais
 */
export function calcularLucroMateriais(materiais: MaterialItem[]): number {
  const valorMateriais = calcularTotalMateriais(materiais);
  const custoReal = calcularCustoRealMateriais(materiais);
  const fretesTotal = materiais.reduce((sum, m) => sum + m.frete, 0);
  
  return valorMateriais - custoReal - fretesTotal;
}

/**
 * Formata um valor monetário para exibição
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Calcula o valor do desconto em reais
 */
export function calcularValorDescontoEmReais(
  subtotal: number,
  desconto?: { tipo: "percentual" | "fixo"; valor: number }
): number {
  if (!desconto || desconto.valor <= 0) {
    return 0;
  }

  if (desconto.tipo === "percentual") {
    return (subtotal * desconto.valor) / 100;
  } else {
    // Desconto fixo: não pode ser maior que o subtotal
    return Math.min(desconto.valor, subtotal);
  }
}

/**
 * Calcula o valor total com desconto
 */
export function calcularValorComDesconto(
  subtotal: number,
  desconto?: { tipo: "percentual" | "fixo"; valor: number }
): { valorDesconto: number; valorTotal: number } {
  const valorDesconto = calcularValorDescontoEmReais(subtotal, desconto);
  const valorTotal = Math.max(0, subtotal - valorDesconto);

  return {
    valorDesconto,
    valorTotal,
  };
}

/**
 * Valida se um orçamento tem dados mínimos válidos
 */
export function validarOrcamento(orcamento: Orcamento): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  
  if (!orcamento.clienteId) {
    erros.push("Cliente não selecionado");
  }
  
  if (orcamento.itens.length === 0 && orcamento.materiais.length === 0) {
    erros.push("Adicione pelo menos um serviço ou material");
  }
  
  if (orcamento.itens.some(item => !item.descricao || item.valor <= 0)) {
    erros.push("Todos os serviços devem ter descrição e valor maior que zero");
  }
  
  if (orcamento.materiais.some(mat => !mat.descricao || mat.valorUnitario <= 0)) {
    erros.push("Todos os materiais devem ter descrição e valor unitário maior que zero");
  }
  
  return {
    valido: erros.length === 0,
    erros,
  };
}
