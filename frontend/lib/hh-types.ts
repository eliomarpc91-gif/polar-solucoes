// Tipos para sistema de HH (Homem-Hora) e Centro de Custos

export interface CustoFixo {
  id: string;
  categoria: "aluguel" | "agua" | "energia" | "internet" | "aplicativos" | "contador" | "funcionarios" | "pro_labore" | "marketing" | "ferramentas" | "seguro" | "veiculo" | "outros";
  descricao: string;
  valor: number;
  mes: number; // 1-12
  ano: number;
  observacoes?: string;
}

export interface CustoVariavel {
  id: string;
  categoria: "combustivel" | "alimentacao" | "hospedagem" | "pedagio" | "estacionamento" | "ajudante" | "desgaste_ferramenta" | "garantia" | "retorno_tecnico" | "imprevistos" | "outros";
  descricao: string;
  valor: number;
  osId?: string; // Vinculado a uma OS
  mes: number;
  ano: number;
  observacoes?: string;
}

export interface Imposto {
  id: string;
  tipo: "simples_nacional" | "imposto_servico" | "imposto_pecas" | "taxas_adicionais";
  descricao: string;
  percentual: number; // % sobre o faturamento
  observacoes?: string;
}

export interface MetasFinanceiras {
  id: string;
  margem_minima: number; // % mínimo de lucro
  lucro_desejado: number; // valor em R$
  faturamento_mensal_desejado: number; // meta de faturamento
  reserva_financeira_ideal: number; // valor de reserva
  horas_produtivas_mensais: number; // horas que geram receita
  atualizado_em: string;
}

export interface CentroDeCustos {
  id: string;
  empresa_id: string;
  custos_fixos: CustoFixo[];
  custos_variaveis: CustoVariavel[];
  impostos: Imposto[];
  metas: MetasFinanceiras;
  mes_atual: number;
  ano_atual: number;
  atualizado_em: string;
}

export interface CalculoHH {
  hh_minimo: number; // Valor mínimo da hora
  hh_ideal: number; // Valor ideal (com margem)
  hh_premium: number; // Valor premium (com margem maior)
  custos_totais_mensais: number;
  impostos_totais: number;
  lucro_desejado: number;
  horas_produtivas: number;
  margem_aplicada: number; // % de margem
}

export interface VariacaoHH {
  tipo: "alta_temporada" | "distancia" | "urgencia" | "horario" | "demanda" | "risco_tecnico" | "complexidade" | "fds_feriado";
  percentual: number; // % de aumento ou redução
  descricao?: string;
}

export interface AnalisePreco {
  status: "saudavel" | "margem_baixa" | "risco_prejuizo";
  margem_estimada: number; // %
  lucro_estimado: number; // R$
  custo_operacional: number; // R$
  custo_real_servico: number; // R$
  valor_ideal_recomendado: number; // R$
  recomendacao: string;
  fatores_analisados: {
    regiao?: string;
    cidade?: string;
    deslocamento?: number;
    urgencia?: boolean;
    horario?: string;
    dificuldade_tecnica?: number; // 1-5
    risco_servico?: number; // 1-5
    garantia?: boolean;
    tempo_estimado?: number; // em horas
    concorrencia?: "alta" | "media" | "baixa";
  };
}

export interface SimuladorOrcamento {
  tipo_servico: string;
  cidade: string;
  tempo_estimado: number; // em horas
  quantidade: number;
  urgencia: boolean;
  deslocamento: number; // em km
  dificuldade_tecnica: number; // 1-5
  risco_servico: number; // 1-5
  garantia: boolean;
  horario: "comercial" | "noturno" | "madrugada";
  dia_semana: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
}

export interface ResultadoSimulador {
  hh_ideal: number;
  valor_minimo: number;
  valor_recomendado: number;
  valor_premium: number;
  margem_estimada: number;
  lucro_estimado: number;
  custo_operacional: number;
  analise: AnalisePreco;
}

export interface RentabilidadeServico {
  id: string;
  tipo_servico: string;
  quantidade_executada: number;
  valor_medio: number;
  lucro_total: number;
  lucro_percentual: number;
  custo_total: number;
  ticket_medio: number;
  margem_media: number;
}

export interface DashboardRentabilidade {
  periodo: {
    mes: number;
    ano: number;
  };
  faturamento_total: number;
  custo_total: number;
  lucro_total: number;
  margem_total: number;
  ticket_medio: number;
  servicos_mais_lucrativos: RentabilidadeServico[];
  servicos_menos_lucrativos: RentabilidadeServico[];
  lucro_por_cliente: { cliente: string; lucro: number }[];
  lucro_por_cidade: { cidade: string; lucro: number }[];
  lucro_por_categoria: { categoria: string; lucro: number }[];
}
