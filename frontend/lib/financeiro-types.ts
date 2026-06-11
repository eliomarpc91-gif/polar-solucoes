/**
 * Tipos para o módulo financeiro completo
 */

// ========== FLUXO DE CAIXA ==========
export interface FluxoDeCaixa {
  id: string;
  data: string; // YYYY-MM-DD
  saldoAnterior: number;
  entradas: number;
  saidas: number;
  saldoDia: number;
  separacao: {
    dinheiroDaEmpresa: number;
    proLabore: number;
    lucro: number;
    reservaFinanceira: number;
    impostos: number;
  };
  criado_em: string;
  atualizado_em: string;
}

// ========== CONTAS A PAGAR ==========
export type CategoriaContaPagar =
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "fornecedor"
  | "emprestimo"
  | "parcela"
  | "ferramenta"
  | "contador"
  | "aplicativo"
  | "salario"
  | "imposto"
  | "outro";

export type StatusContaPagar = "pendente" | "pago" | "atrasado" | "parcelado";

export type RecorrenciaContaPagar = "unica" | "mensal" | "trimestral" | "anual";

export interface ContaPagar {
  id: string;
  descricao: string;
  categoria: CategoriaContaPagar;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  recorrencia: RecorrenciaContaPagar;
  status: StatusContaPagar;
  comprovante?: string; // URL ou caminho do arquivo
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

// ========== CONTAS A RECEBER ==========
export type StatusContaReceber = "pendente" | "parcialmente_pago" | "pago" | "atrasado";

export interface ContaReceber {
  id: string;
  orcamentoId?: string; // Referência ao orçamento
  osId?: string; // Referência à OS
  clienteId: string;
  clienteNome: string;
  descricao: string;
  valorTotal: number;
  entrada50Porcento: number;
  saldoRestante: number;
  valorRecebido: number;
  vencimento: string; // YYYY-MM-DD
  formaPagamento: string; // PIX, Transferência, Dinheiro, Cheque, etc
  status: StatusContaReceber;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

// ========== CENTRO DE CUSTOS ==========
export type CategoriaCusto =
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "fornecedor"
  | "deslocamento"
  | "combustivel"
  | "ajudante"
  | "hospedagem"
  | "garantia"
  | "retorno_tecnico"
  | "ferramenta"
  | "imposto"
  | "alimentacao"
  | "frete"
  | "outro";

export interface CentroCustos {
  id: string;
  categoria: CategoriaCusto;
  descricao: string;
  valor: number;
  mes: number; // 1-12
  ano: number;
  criado_em: string;
  atualizado_em: string;
}

// ========== LUCRATIVIDADE POR SERVIÇO ==========
export interface LucratividadeServico {
  id: string;
  osId: string;
  orcamentoId?: string;
  clienteId: string;
  descricao: string;
  valorCobrado: number;
  custoMaterial: number;
  deslocamento: number;
  hh: number;
  ajudante: number;
  imposto: number;
  lucroBruto: number;
  lucroLiquido: number;
  margemLucro: number; // percentual
  analiseIA?: string; // Análise gerada pela IA
  criado_em: string;
  atualizado_em: string;
}

// ========== RESERVA FINANCEIRA AUTOMÁTICA ==========
export interface ConfiguracaoReserva {
  id: string;
  percentualImposto: number; // ex: 15%
  percentualCapitalGiro: number; // ex: 10%
  percentualManutencao: number; // ex: 5%
  percentualReservaEmpresa: number; // ex: 20%
  percentualLucroLiquido: number; // ex: 50%
  criado_em: string;
  atualizado_em: string;
}

export interface ReservaFinanceira {
  id: string;
  dataRecebimento: string; // YYYY-MM-DD
  valorTotal: number;
  impostos: number;
  capitalGiro: number;
  manutencao: number;
  reservaEmpresa: number;
  lucroLiquido: number;
  criado_em: string;
  atualizado_em: string;
}

// ========== IA FINANCEIRA ==========
export interface AlertaFinanceiro {
  id: string;
  tipo: "aviso" | "alerta" | "critico";
  titulo: string;
  mensagem: string;
  recomendacao?: string;
  lido: boolean;
  criado_em: string;
}

export interface AnaliseFinanceiraIA {
  id: string;
  mes: number;
  ano: number;
  saudeFinanceira: "otima" | "boa" | "regular" | "critica"; // score 0-100
  margemMediaLucro: number;
  risco: "baixo" | "medio" | "alto";
  fluxoCaixa: "positivo" | "negativo" | "equilibrado";
  inadimplencia: number; // percentual
  gastosExcessivos: string[]; // categorias com gastos altos
  lucratividade: number; // percentual
  alertas: AlertaFinanceiro[];
  recomendacoes: string[];
  criado_em: string;
}

// ========== DASHBOARD FINANCEIRO ==========
export interface DashboardFinanceiro {
  mes: number;
  ano: number;
  faturamento: number;
  lucroLiquido: number;
  despesas: number;
  contasVencidas: number;
  contasAVencer: number;
  clientesDevendo: number;
  servicosMaisLucrativos: LucratividadeServico[];
  ticketMedio: number;
  margemMedia: number;
  crescimentoMensal: number; // percentual
  saldoDisponivel: number;
  graficoFaturamento: { mes: string; valor: number }[];
  graficoLucro: { mes: string; valor: number }[];
  graficoDespesas: { categoria: string; valor: number }[];
}


// ========== PREJUÍZO OCULTO ==========
export interface PrejuizoOcultoAnalise {
  id: string;
  osId: string;
  servicoDescricao: string;
  clienteId: string;
  clienteNome: string;
  lucroPrevisto: number;
  lucroReal: number;
  diferenca: number;
  percentualDiferenca: number;
  causas: string[]; // "Deslocamento excessivo", "Retorno de garantia", "Tempo improdutivo", etc.
  alertas: string[];
  severidade: "baixa" | "media" | "alta" | "critica";
  detalhes: {
    deslocamento: number;
    deslocamentoImpacto: number;
    retornoGarantia: number;
    retornoImpacto: number;
    tempoImprodutivo: number;
    tempoImpacto: number;
    custosOcultos: number;
    margem: number;
    margemEsperada: number;
  };
  recomendacoes: string[];
  criado_em: string;
  atualizado_em: string;
}

export interface ClienteScore {
  id: string;
  clienteId: string;
  clienteNome: string;
  score: number; // 0-100
  nivel: "excelente" | "saudavel" | "risco" | "inadimplente";
  metricas: {
    pagamentosEmDia: number; // percentual
    atrasos: number;
    aprovacaoOrcamento: number; // percentual
    frequenciaContratacao: number;
    lucrabilidadeCliente: number;
    quantidadeRetorno: number;
    risco: number; // 0-100
  };
  historico: {
    totalServiços: number;
    totalFaturado: number;
    totalLucro: number;
    margemMedia: number;
    inadimplenciaPercentual: number;
    recorrencia: number;
  };
  alertas: string[];
  criado_em: string;
  atualizado_em: string;
}

export interface SimuladorExpansao {
  id: string;
  cidade: string;
  estado: string;
  aluguel: number;
  despesasFixas: number;
  custosOperacionais: number;
  servicosEstimados: number;
  equipeSize: number;
  deslocamentoMedio: number;
  investimentoInicial: number;
  resultado: {
    faturamentoMinimo: number;
    clientesIdeais: number;
    riscoFinanceiro: "baixo" | "moderado" | "alto";
    lucroEstimado: number;
    viabilidade: "viavel" | "risco_moderado" | "nao_recomendado";
    tempoRetorno: number; // em meses
    payback: number;
  };
  criado_em: string;
  atualizado_em: string;
}

export interface ControlGarantiaFinanceira {
  id: string;
  mes: number;
  ano: number;
  totalPerdidoGarantia: number;
  custoRetornoTecnico: number;
  custoPecasGarantia: number;
  equipamentosComMaisRetorno: Array<{
    equipamento: string;
    quantidade: number;
    custo: number;
  }>;
  clientesComMaisGarantia: Array<{
    clienteId: string;
    clienteNome: string;
    quantidade: number;
    custo: number;
  }>;
  servicosComMaisProblemas: Array<{
    servico: string;
    quantidade: number;
    custo: number;
  }>;
  alertas: string[];
  criado_em: string;
  atualizado_em: string;
}

export interface SugestaoPreco {
  orcamentoId: string;
  precoIdeal: number;
  margemSegura: number;
  descontoMaximo: number;
  valorPremium: number;
  valorMinimo: number;
  analise: {
    concorrencia: string;
    cidade: string;
    tipoCliente: string;
    deslocamento: number;
    riscoTecnico: "baixo" | "medio" | "alto";
    urgencia: "baixa" | "media" | "alta";
    historicoCliente: string;
  };
  recomendacao: string;
  criado_em: string;
}

export interface RelatorioImposto {
  id: string;
  mes: number;
  ano: number;
  previsaoMensal: number;
  previsaoAnual: number;
  separacaoAutomatica: number;
  impostoSobrePecas: number;
  impostoSobreServico: number;
  impostoTotal: number;
  lucroLiquidoAposImposto: number;
  resumoTributario: string;
  criado_em: string;
  atualizado_em: string;
}

export interface RentabilidadePorCidade {
  id: string;
  cidade: string;
  estado: string;
  faturamento: number;
  lucro: number;
  custoOperacional: number;
  margem: number;
  inadimplencia: number;
  retornoTecnico: number;
  serviços: number;
  clientes: number;
  ranking: number;
  criado_em: string;
  atualizado_em: string;
}

export interface EmpresaEmRisco {
  id: string;
  risco: "baixo" | "moderado" | "alto" | "critico";
  indicadores: {
    caixaNegativo: boolean;
    excessoDividas: boolean;
    baixaMargemLucro: boolean;
    crescimentoDesorganizado: boolean;
    inadimplenciaAlta: boolean;
    excessoGarantia: boolean;
    lucroInsuficiente: boolean;
  };
  sugestoes: string[];
  acoes: Array<{
    acao: string;
    impacto: number;
    prioridade: "alta" | "media" | "baixa";
  }>;
  criado_em: string;
  atualizado_em: string;
}

export interface ContratoMensal {
  id: string;
  clienteId: string;
  clienteNome: string;
  descricao: string;
  valor: number;
  dataInicio: string;
  dataVencimento: string;
  status: "ativo" | "vencido" | "cancelado";
  renovacao: "automatica" | "manual";
  reajusteAnual: number; // percentual
  visitasPreventivas: number;
  proximaVisita: string;
  inadimplencia: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface DocumentoAdministrativo {
  id: string;
  tipo: "contrato" | "art" | "certificado" | "garantia" | "nf" | "licenca" | "crt" | "cft" | "tecnico" | "comprovante";
  nome: string;
  descricao: string;
  clienteId?: string;
  osId?: string;
  equipamentoId?: string;
  dataUpload: string;
  dataVencimento?: string;
  url: string;
  status: "ativo" | "vencido" | "arquivado";
  criado_em: string;
  atualizado_em: string;
}


// ============================================
// PLANTÃO 24H INTELIGENTE
// ============================================

export type NivelUrgencia = "baixa" | "media" | "alta" | "critica";
export type TipoAtendimento = "comercial" | "noturno" | "feriado" | "emergencia";

export interface ChamadoPlantao {
  id: string;
  clienteId: string;
  equipamentoId?: string;
  descricao: string;
  nivelUrgencia: NivelUrgencia;
  tipoAtendimento: TipoAtendimento;
  horarioChamado: string;
  horarioAtendimento?: string;
  tempoResposta?: number; // em minutos
  riscoPerdaMercadoria: boolean;
  riscoOperacional: number; // 0-100
  impactoFinanceiro: number; // em R$
  taxaAplicada: number; // percentual
  hhEmergencial: number;
  margemRecalculada: number;
  status: "pendente" | "em-atendimento" | "concluido" | "cancelado";
  dataRegistro: string;
}

export interface ConfiguracaoPlantao {
  id: string;
  horarioComercialInicio: string; // HH:MM
  horarioComercialFim: string;
  percentualAcrescimoNoturno: number; // %
  percentualAcrescimoFeriado: number;
  percentualAcrescimoFinSemana: number;
  percentualAcrescimoDeslocamento: number;
  taxaMinimaEmergencia: number; // R$
  clientesPrioritarios: string[]; // IDs
  cidadesAtendidas: string[];
  ativo: boolean;
}

export interface AlertaUrgencia {
  id: string;
  chamadoId: string;
  tipo: "equipamento-critico" | "risco-mercadoria" | "fora-horario" | "cliente-prioritario" | "emergencia-aplicada";
  mensagem: string;
  severidade: "info" | "aviso" | "alerta" | "critico";
  dataAlerta: string;
  lido: boolean;
}

export interface DashboardPlantao {
  chamadosUrgentes: number;
  atendimentosAndamento: number;
  chamadosCriticos: number;
  tempoMedioResposta: number; // minutos
  faturamentoPlantao: number;
  lucroPlantao: number;
  cidadesComMaisEmergencias: Array<{ cidade: string; quantidade: number }>;
  ultimosChamados: ChamadoPlantao[];
}

// ============================================
// IA DE COMPRAS E ESTOQUE INTELIGENTE
// ============================================

export interface ItemEstoque {
  id: string;
  nome: string;
  descricao: string;
  codigoInterno: string;
  quantidade: number;
  quantidadeMinima: number;
  quantidadeCritica: number;
  preco: number;
  custo: number;
  margemLucro: number;
  categoria: string;
  fornecedorId?: string;
  dataUltimaCompra?: string;
  dataUltimaUtilizacao?: string;
  rotatividade: "alta" | "media" | "baixa" | "parada";
  sazonalidade: "sim" | "nao";
  equipamentosAtendidos: string[]; // IDs
  lucroTotal: number;
  retornoMedio: number;
}

export interface PrevisaoCompra {
  id: string;
  itemId: string;
  quantidadeRecomendada: number;
  melhorMomento: string; // data
  riscoDeFalta: number; // 0-100
  riscoDeSobra: number; // 0-100
  demandaPrevista: number;
  sazonalidade: string;
  sugestao: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  dataCriacao: string;
  status: "pendente" | "comprado" | "descartado";
}

export interface AnaliseEstoque {
  id: string;
  dataAnalise: string;
  valorTotalEstoque: number;
  capitalParado: number;
  custoEstoque: number;
  lucroTotal: number;
  peçasComBaixaSaida: ItemEstoque[];
  peçasEstrategicas: ItemEstoque[];
  peçasParadas: ItemEstoque[];
  peçasMaisLucrativas: ItemEstoque[];
  peçasMaisUsadas: ItemEstoque[];
  desperdicio: number;
  eficiencia: number; // 0-100
}

export interface AlertaEstoque {
  id: string;
  itemId: string;
  tipo: "estoque-baixo" | "peça-acabando" | "compra-recomendada" | "excesso-estoque" | "peça-parada";
  mensagem: string;
  severidade: "info" | "aviso" | "alerta" | "critico";
  dataAlerta: string;
  lido: boolean;
}

export interface DashboardEstoque {
  peçasMaisUsadas: ItemEstoque[];
  peçasMaisLucrativas: ItemEstoque[];
  peçasComMaiorSaida: ItemEstoque[];
  peçasComMenorSaida: ItemEstoque[];
  valorTotalEstoque: number;
  estoqueCritico: number;
  comprasRecomendadas: PrevisaoCompra[];
  alertas: AlertaEstoque[];
}
