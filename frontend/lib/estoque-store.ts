import AsyncStorage from "@react-native-async-storage/async-storage";
import { Produto, MovimentacaoEstoque, AlertaEstoque } from "./estoque-types";

// Storage keys
const KEYS = {
  PRODUTOS: "@polar/produtos",
  MOVIMENTACOES: "@polar/movimentacoes_estoque",
  ALERTAS: "@polar/alertas_estoque",
};

// Helper functions
async function getItems<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// Função auxiliar para calcular custo real
export function calcularCustoReal(
  precoCompra: number,
  frete: number,
  impostos: number
): number {
  return precoCompra + frete + impostos;
}

// Função auxiliar para calcular preço de venda
export function calcularPrecoVenda(
  custoReal: number,
  lucroPercentual: number
): number {
  return custoReal + (custoReal * lucroPercentual) / 100;
}

// Produtos
export async function getProdutos(): Promise<Produto[]> {
  return getItems<Produto>(KEYS.PRODUTOS);
}

export async function saveProduto(produto: Produto): Promise<void> {
  const produtos = await getProdutos();
  const index = produtos.findIndex((p) => p.id === produto.id);
  if (index >= 0) {
    produtos[index] = produto;
  } else {
    produtos.push(produto);
  }
  await setItems(KEYS.PRODUTOS, produtos);
  // Sincroniza com backend (não bloqueia se offline)
  try {
    const { remote } = await import("./api-client");
    await remote.upsert("produtos", produto);
  } catch {
    // ignora se offline
  }
}

export async function deleteProduto(id: string): Promise<void> {
  const produtos = await getProdutos();
  await setItems(
    KEYS.PRODUTOS,
    produtos.filter((p) => p.id !== id)
  );
}

export async function getProdutoById(id: string): Promise<Produto | null> {
  const produtos = await getProdutos();
  return produtos.find((p) => p.id === id) || null;
}

// Movimentações de estoque
export async function getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
  return getItems<MovimentacaoEstoque>(KEYS.MOVIMENTACOES);
}

export async function saveMovimentacao(
  movimentacao: MovimentacaoEstoque
): Promise<void> {
  const movimentacoes = await getMovimentacoes();
  movimentacoes.push(movimentacao);
  await setItems(KEYS.MOVIMENTACOES, movimentacoes);
}

export async function getMovimentacoesPorProduto(
  produtoId: string
): Promise<MovimentacaoEstoque[]> {
  const movimentacoes = await getMovimentacoes();
  return movimentacoes.filter((m) => m.produtoId === produtoId);
}

// Alertas de estoque
export async function getAlertas(): Promise<AlertaEstoque[]> {
  return getItems<AlertaEstoque>(KEYS.ALERTAS);
}

export async function saveAlerta(alerta: AlertaEstoque): Promise<void> {
  const alertas = await getAlertas();
  const index = alertas.findIndex((a) => a.id === alerta.id);
  if (index >= 0) {
    alertas[index] = alerta;
  } else {
    alertas.push(alerta);
  }
  await setItems(KEYS.ALERTAS, alertas);
}

export async function deleteAlerta(id: string): Promise<void> {
  const alertas = await getAlertas();
  await setItems(
    KEYS.ALERTAS,
    alertas.filter((a) => a.id !== id)
  );
}

// Função para verificar e criar alertas de baixo estoque
export async function verificarBaixoEstoque(): Promise<void> {
  const produtos = await getProdutos();
  const alertas = await getAlertas();

  for (const produto of produtos) {
    if (produto.quantidade <= produto.estoque_minimo) {
      // Verificar se já existe alerta de baixo estoque para este produto
      const alertaExistente = alertas.find(
        (a) => a.produtoId === produto.id && a.tipo === "baixo_estoque"
      );

      if (!alertaExistente) {
        const novoAlerta: AlertaEstoque = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          produtoId: produto.id,
          tipo: "baixo_estoque",
          mensagem: `Produto "${produto.nome}" está com estoque baixo (${produto.quantidade}/${produto.estoque_minimo})`,
          lido: false,
          criadoEm: new Date().toISOString(),
        };
        await saveAlerta(novoAlerta);
      }
    }
  }
}

// Função para dar baixa no estoque
export async function darBaixaEstoque(
  produtoId: string,
  quantidade: number,
  motivo: string,
  referenciaId?: string
): Promise<boolean> {
  const produto = await getProdutoById(produtoId);
  if (!produto) return false;

  if (produto.quantidade < quantidade) {
    return false; // Quantidade insuficiente
  }

  // Atualizar quantidade do produto
  produto.quantidade -= quantidade;
  produto.atualizadoEm = new Date().toISOString();
  await saveProduto(produto);

  // Registrar movimentação
  const movimentacao: MovimentacaoEstoque = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    produtoId,
    tipo: "saida",
    quantidade,
    motivo,
    referenciaId,
    criadoEm: new Date().toISOString(),
  };
  await saveMovimentacao(movimentacao);

  // Verificar se ficou com baixo estoque
  await verificarBaixoEstoque();

  return true;
}

// Função para adicionar estoque (entrada)
export async function adicionarEstoque(
  produtoId: string,
  quantidade: number,
  motivo: string,
  referenciaId?: string
): Promise<boolean> {
  const produto = await getProdutoById(produtoId);
  if (!produto) return false;

  // Atualizar quantidade do produto
  produto.quantidade += quantidade;
  produto.atualizadoEm = new Date().toISOString();
  await saveProduto(produto);

  // Registrar movimentação
  const movimentacao: MovimentacaoEstoque = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    produtoId,
    tipo: "entrada",
    quantidade,
    motivo,
    referenciaId,
    criadoEm: new Date().toISOString(),
  };
  await saveMovimentacao(movimentacao);

  return true;
}

// Função para desfazer movimentação (ex: quando OS é cancelada)
export async function desfazerMovimentacao(
  movimentacaoId: string
): Promise<boolean> {
  const movimentacoes = await getMovimentacoes();
  const movimentacao = movimentacoes.find((m) => m.id === movimentacaoId);

  if (!movimentacao) return false;

  const produto = await getProdutoById(movimentacao.produtoId);
  if (!produto) return false;

  // Reverter a movimentação
  if (movimentacao.tipo === "saida") {
    produto.quantidade += movimentacao.quantidade;
  } else if (movimentacao.tipo === "entrada") {
    produto.quantidade -= movimentacao.quantidade;
  }

  produto.atualizadoEm = new Date().toISOString();
  await saveProduto(produto);

  return true;
}

// Função para gerar relatório de estoque
export async function gerarRelatorioEstoque(): Promise<{
  totalProdutos: number;
  custoTotalEstoque: number;
  lucroTotalPotencial: number;
  produtosBaixoEstoque: Produto[];
  produtosSemMovimentacao: Produto[];
}> {
  const produtos = await getProdutos();
  const movimentacoes = await getMovimentacoes();

  let custoTotalEstoque = 0;
  let lucroTotalPotencial = 0;
  const produtosBaixoEstoque: Produto[] = [];
  const produtosSemMovimentacao: Produto[] = [];

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30); // 30 dias sem movimentação

  for (const produto of produtos) {
    // Calcular custo total e lucro potencial
    custoTotalEstoque += produto.custo_real * produto.quantidade;
    lucroTotalPotencial +=
      (produto.preco_venda - produto.custo_real) * produto.quantidade;

    // Verificar baixo estoque
    if (produto.quantidade <= produto.estoque_minimo) {
      produtosBaixoEstoque.push(produto);
    }

    // Verificar produtos sem movimentação
    const movimentacoesProduto = movimentacoes.filter(
      (m) => m.produtoId === produto.id
    );
    if (movimentacoesProduto.length === 0) {
      produtosSemMovimentacao.push(produto);
    } else {
      const ultimaMovimentacao = movimentacoesProduto[
        movimentacoesProduto.length - 1
      ];
      if (new Date(ultimaMovimentacao.criadoEm) < dataLimite) {
        produtosSemMovimentacao.push(produto);
      }
    }
  }

  return {
    totalProdutos: produtos.length,
    custoTotalEstoque,
    lucroTotalPotencial,
    produtosBaixoEstoque,
    produtosSemMovimentacao,
  };
}
