// Tipos para o sistema de estoque

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  codigo: string; // Código interno
  fornecedor: string;
  quantidade: number; // Quantidade em estoque
  estoque_minimo: number; // Estoque mínimo
  preco_compra: number; // Preço de compra unitário
  frete: number; // Frete total do produto
  impostos: number; // Impostos totais do produto
  lucro_percentual: number; // % de lucro sobre o produto
  custo_real: number; // Calculado: preco_compra + frete + impostos
  preco_venda: number; // Calculado: custo_real + (custo_real * lucro_percentual / 100)
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  tipo: "entrada" | "saida" | "ajuste"; // entrada (compra), saída (OS/Orçamento), ajuste (inventário)
  quantidade: number;
  motivo: string; // "Compra", "OS #123", "Ajuste de inventário", etc.
  referenciaId?: string; // ID da OS ou Orçamento
  criadoEm: string;
}

export interface AlertaEstoque {
  id: string;
  produtoId: string;
  tipo: "baixo_estoque" | "sem_movimentacao" | "falta_em_os";
  mensagem: string;
  lido: boolean;
  criadoEm: string;
}
