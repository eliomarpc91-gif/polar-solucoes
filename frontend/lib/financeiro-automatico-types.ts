/**
 * Tipos para o módulo financeiro automático
 * Entradas automáticas (orçamentos, OS, pagamentos)
 * Saídas manuais (despesas)
 */

// ========== CATEGORIAS E STATUS ==========

export type CategoriaEntrada =
  | "servico"
  | "material"
  | "manutencao"
  | "garantia"
  | "outro";

export type CategoriaSaida =
  | "material"
  | "pecas"
  | "frete"
  | "transporte"
  | "alimentacao"
  | "ferramentas"
  | "funcionario"
  | "aluguel"
  | "agua"
  | "luz"
  | "aplicativo"
  | "impostos"
  | "despesas_gerais";

export type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "transferencia"
  | "cheque"
  | "cartao_credito"
  | "cartao_debito"
  | "boleto"
  | "outro";

export type StatusFinanceiro =
  | "pago"
  | "parcial"
  | "pendente"
  | "atrasado"
  | "cancelado";

// ========== ENTRADA FINANCEIRA ==========

export interface EntradaFinanceira {
  id: string;
  data: string; // YYYY-MM-DD
  clienteId: string;
  clienteNome: string;
  orcamentoId?: string; // Referência ao orçamento
  osId?: string; // Referência à OS
  descricao: string;
  categoria: CategoriaEntrada;
  valorTotal: number;
  valorRecebido: number;
  valorPendente: number;
  formaPagamento: FormaPagamento;
  status: StatusFinanceiro;
  dataVencimento?: string; // YYYY-MM-DD
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  origem: "orcamento" | "os" | "manual"; // De onde foi gerada
}

// ========== SAÍDA FINANCEIRA ==========

export interface SaidaFinanceira {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: CategoriaSaida;
  valor: number;
  formaPagamento: FormaPagamento;
  fornecedor?: string;
  observacoes?: string;
  comprovante?: string; // URL ou caminho do arquivo
  criado_em: string;
  atualizado_em: string;
}

// ========== RESUMO FINANCEIRO DO MÊS ==========

export interface ResumenFinanceiroMes {
  mes: number; // 1-12
  ano: number;
  totalEntradas: number;
  totalSaidas: number;
  lucroLiquido: number; // totalEntradas - totalSaidas
  contasAReceber: number;
  contasPagas: number;
  contasPendentes: number;
  orcamentosAprovados: number;
  osFinalizadas: number;
  entradas: EntradaFinanceira[];
  saidas: SaidaFinanceira[];
}

// ========== FILTROS ==========

export interface FiltrosFinanceiros {
  periodo?: "dia" | "semana" | "mes" | "ano";
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  clienteId?: string;
  categoria?: CategoriaEntrada | CategoriaSaida;
  status?: StatusFinanceiro;
  formaPagamento?: FormaPagamento;
  tipo?: "entrada" | "saida"; // entrada ou saída
  busca?: string; // busca por descrição/cliente
}

// ========== TRANSAÇÃO CONSOLIDADA ==========

export interface TransacaoConsolidada {
  id: string;
  data: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  saldo: number; // saldo acumulado até essa data
  categoria: CategoriaEntrada | CategoriaSaida;
  status?: StatusFinanceiro;
  clienteNome?: string;
  formaPagamento?: FormaPagamento;
}

// ========== CONFIGURAÇÃO DE ENTRADA AUTOMÁTICA ==========

export interface ConfiguracaoEntradaAutomatica {
  id: string;
  orcamentoAprovado: boolean; // Criar entrada ao aprovar orçamento
  osFinalizadaAprovada: boolean; // Criar entrada ao finalizar OS
  percentualEntradaOrcamento: number; // ex: 50 (50%)
  criarContasAReceber: boolean; // Marcar como "contas a receber" quando parcial
  evitarDuplicacao: boolean; // Verificar se já existe entrada para o mesmo orçamento/OS
  criado_em: string;
  atualizado_em: string;
}
