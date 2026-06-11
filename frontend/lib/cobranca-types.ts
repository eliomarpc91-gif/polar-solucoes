/**
 * Tipos e interfaces para o sistema de cobranças
 */

export type StatusCobranca = "pendente" | "pago" | "vencido" | "parcial" | "cancelado";
export type FormaPagamentoCobranca = "pix" | "boleto" | "cartao_credito" | "dinheiro" | "transferencia";

export interface Cobranca {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  
  // Valores
  valorTotal: number;
  valorRecebido: number;
  valorPendente: number;
  juros: number; // % ou valor fixo
  multa: number; // valor fixo
  desconto: number; // valor fixo
  
  // Datas
  dataCriacao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string; // YYYY-MM-DD
  
  // Detalhes
  descricao: string;
  formaPagamento: FormaPagamentoCobranca;
  status: StatusCobranca;
  
  // Referências
  orcamentoId?: string;
  orcamentoNumero?: number;
  osId?: string;
  osNumero?: number;
  
  // Controle
  mensagensEnviadas: number;
  ultimoEnvio?: string; // ISO datetime
  observacoes?: string;
  
  // Timestamps
  criado_em: string;
  atualizado_em: string;
}

export interface ModeloMensagem {
  id: string;
  nome: string;
  tipo: "cobranca_normal" | "lembrete_vencimento" | "cobranca_vencida" | "confirmacao_pagamento" | "cobranca_parcial";
  template: string; // Template com {{placeholders}}
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface ConfiguracaoCobranca {
  chavePix?: string;
  numeroAgencia?: string;
  numeroConta?: string;
  bancoNome?: string;
  cnpjEmpresa?: string;
  nomeEmpresa?: string;
  telefonEmpresa?: string;
  emailEmpresa?: string;
  logoUrl?: string;
  
  // Configurações automáticas
  enviarLembreteAntesDias?: number; // Dias antes do vencimento
  aplicarJurosAutomatico?: boolean;
  aplicarMultaAutomatico?: boolean;
  
  // Mensagens padrão
  mensagensPadrao: {
    cobrancaNormal: string;
    lembreteVencimento: string;
    cobrancaVencida: string;
    confirmacaoPagamento: string;
    cobrancaParcial: string;
  };
}

export interface PagamentoCobranca {
  id: string;
  cobrancaId: string;
  valor: number;
  data: string; // YYYY-MM-DD
  formaPagamento: FormaPagamentoCobranca;
  referencia?: string; // PIX, boleto, etc
  observacoes?: string;
  criado_em: string;
}

export interface ReciboCobranca {
  id: string;
  cobrancaId: string;
  pagamentoId: string;
  numero: string; // Número sequencial do recibo
  dataEmissao: string; // YYYY-MM-DD
  clienteNome: string;
  clienteCPFCNPJ?: string;
  valorRecebido: number;
  formaPagamento: FormaPagamentoCobranca;
  descricao: string;
  assinatura?: string; // Base64
  criado_em: string;
}

export interface FiltrosCobranca {
  status?: StatusCobranca;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
  formaPagamento?: FormaPagamentoCobranca;
  busca?: string; // Busca por nome do cliente ou descrição
  vencidas?: boolean; // Apenas cobranças vencidas
}

export interface ResumoCobrancas {
  totalCobrancas: number;
  totalPendente: number;
  totalVencido: number;
  totalRecebido: number;
  percentualRecebimento: number;
  cobrancasVencidas: number;
  cobrancasProximas: number; // Vencimento nos próximos 7 dias
}
