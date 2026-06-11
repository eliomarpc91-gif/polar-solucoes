import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CentroDeCustos,
  CustoFixo,
  CustoVariavel,
  Imposto,
  MetasFinanceiras,
  CalculoHH,
  AnalisePreco,
  SimuladorOrcamento,
  ResultadoSimulador,
  DashboardRentabilidade,
} from "./hh-types";
import { generateId } from "./store";

const CENTRO_CUSTOS_KEY = "centro_custos";

// ========== CENTRO DE CUSTOS ==========

export async function getCentroDeCustos(): Promise<CentroDeCustos | null> {
  try {
    const data = await AsyncStorage.getItem(CENTRO_CUSTOS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erro ao carregar centro de custos:", error);
    return null;
  }
}

export async function saveCentroDeCustos(centro: CentroDeCustos): Promise<void> {
  try {
    await AsyncStorage.setItem(CENTRO_CUSTOS_KEY, JSON.stringify(centro));
  } catch (error) {
    console.error("Erro ao salvar centro de custos:", error);
  }
}

export async function adicionarCustoFixo(custo: Omit<CustoFixo, "id">): Promise<CustoFixo> {
  let centro = await getCentroDeCustos();
  const novoCusto: CustoFixo = { ...custo, id: generateId() };

  if (!centro) {
    centro = {
      id: generateId(),
      empresa_id: "default",
      custos_fixos: [novoCusto],
      custos_variaveis: [],
      impostos: [],
      metas: {
        id: generateId(),
        margem_minima: 30,
        lucro_desejado: 5000,
        faturamento_mensal_desejado: 50000,
        reserva_financeira_ideal: 10000,
        horas_produtivas_mensais: 160,
        atualizado_em: new Date().toISOString(),
      },
      mes_atual: new Date().getMonth() + 1,
      ano_atual: new Date().getFullYear(),
      atualizado_em: new Date().toISOString(),
    };
  } else {
    centro.custos_fixos.push(novoCusto);
    centro.atualizado_em = new Date().toISOString();
  }

  await saveCentroDeCustos(centro);
  return novoCusto;
}

export async function removerCustoFixo(id: string): Promise<void> {
  const centro = await getCentroDeCustos();
  if (centro) {
    centro.custos_fixos = centro.custos_fixos.filter((c) => c.id !== id);
    centro.atualizado_em = new Date().toISOString();
    await saveCentroDeCustos(centro);
  }
}

export async function adicionarCustoVariavel(custo: Omit<CustoVariavel, "id">): Promise<CustoVariavel> {
  let centro = await getCentroDeCustos();
  const novoCusto: CustoVariavel = { ...custo, id: generateId() };

  if (!centro) {
    centro = {
      id: generateId(),
      empresa_id: "default",
      custos_fixos: [],
      custos_variaveis: [novoCusto],
      impostos: [],
      metas: {
        id: generateId(),
        margem_minima: 30,
        lucro_desejado: 5000,
        faturamento_mensal_desejado: 50000,
        reserva_financeira_ideal: 10000,
        horas_produtivas_mensais: 160,
        atualizado_em: new Date().toISOString(),
      },
      mes_atual: new Date().getMonth() + 1,
      ano_atual: new Date().getFullYear(),
      atualizado_em: new Date().toISOString(),
    };
  } else {
    centro.custos_variaveis.push(novoCusto);
    centro.atualizado_em = new Date().toISOString();
  }

  await saveCentroDeCustos(centro);
  return novoCusto;
}

export async function removerCustoVariavel(id: string): Promise<void> {
  const centro = await getCentroDeCustos();
  if (centro) {
    centro.custos_variaveis = centro.custos_variaveis.filter((c) => c.id !== id);
    centro.atualizado_em = new Date().toISOString();
    await saveCentroDeCustos(centro);
  }
}

export async function adicionarImposto(imposto: Omit<Imposto, "id">): Promise<Imposto> {
  let centro = await getCentroDeCustos();
  const novoImposto: Imposto = { ...imposto, id: generateId() };

  if (!centro) {
    centro = {
      id: generateId(),
      empresa_id: "default",
      custos_fixos: [],
      custos_variaveis: [],
      impostos: [novoImposto],
      metas: {
        id: generateId(),
        margem_minima: 30,
        lucro_desejado: 5000,
        faturamento_mensal_desejado: 50000,
        reserva_financeira_ideal: 10000,
        horas_produtivas_mensais: 160,
        atualizado_em: new Date().toISOString(),
      },
      mes_atual: new Date().getMonth() + 1,
      ano_atual: new Date().getFullYear(),
      atualizado_em: new Date().toISOString(),
    };
  } else {
    centro.impostos.push(novoImposto);
    centro.atualizado_em = new Date().toISOString();
  }

  await saveCentroDeCustos(centro);
  return novoImposto;
}

export async function removerImposto(id: string): Promise<void> {
  const centro = await getCentroDeCustos();
  if (centro) {
    centro.impostos = centro.impostos.filter((i) => i.id !== id);
    centro.atualizado_em = new Date().toISOString();
    await saveCentroDeCustos(centro);
  }
}

export async function atualizarMetas(metas: MetasFinanceiras): Promise<void> {
  let centro = await getCentroDeCustos();
  if (!centro) {
    centro = {
      id: generateId(),
      empresa_id: "default",
      custos_fixos: [],
      custos_variaveis: [],
      impostos: [],
      metas,
      mes_atual: new Date().getMonth() + 1,
      ano_atual: new Date().getFullYear(),
      atualizado_em: new Date().toISOString(),
    };
  } else {
    centro.metas = metas;
    centro.atualizado_em = new Date().toISOString();
  }
  await saveCentroDeCustos(centro);
}

// ========== CÁLCULO DE HH ==========

export async function calcularHH(): Promise<CalculoHH> {
  const centro = await getCentroDeCustos();

  if (!centro) {
    return {
      hh_minimo: 0,
      hh_ideal: 0,
      hh_premium: 0,
      custos_totais_mensais: 0,
      impostos_totais: 0,
      lucro_desejado: 0,
      horas_produtivas: 0,
      margem_aplicada: 0,
    };
  }

  // Calcular custos totais fixos
  const custosTotaisFixos = centro.custos_fixos.reduce((sum, c) => sum + c.valor, 0);

  // Calcular custos totais variáveis
  const custosTotaisVariaveis = centro.custos_variaveis.reduce((sum, c) => sum + c.valor, 0);

  // Calcular impostos totais (em percentual)
  const impostosTotaisPercentual = centro.impostos.reduce((sum, i) => sum + i.percentual, 0);

  const custosTotaisMensais = custosTotaisFixos + custosTotaisVariaveis;
  const lucroDesejado = centro.metas.lucro_desejado;
  const horasProdutivasMensais = centro.metas.horas_produtivas_mensais;
  const margemMinima = centro.metas.margem_minima;

  // HH Mínimo: (Custos Totais) ÷ Horas Produtivas
  const hhMinimo = horasProdutivasMensais > 0 ? custosTotaisMensais / horasProdutivasMensais : 0;

  // HH Ideal: (Custos Totais + Lucro Desejado) ÷ Horas Produtivas
  const hhIdeal = horasProdutivasMensais > 0 ? (custosTotaisMensais + lucroDesejado) / horasProdutivasMensais : 0;

  // HH Premium: HH Ideal + 30% (margem extra)
  const hhPremium = hhIdeal * 1.3;

  return {
    hh_minimo: Math.round(hhMinimo * 100) / 100,
    hh_ideal: Math.round(hhIdeal * 100) / 100,
    hh_premium: Math.round(hhPremium * 100) / 100,
    custos_totais_mensais: custosTotaisMensais,
    impostos_totais: impostosTotaisPercentual,
    lucro_desejado: lucroDesejado,
    horas_produtivas: horasProdutivasMensais,
    margem_aplicada: margemMinima,
  };
}

// ========== ANÁLISE DE PREÇO ==========

export async function analisarPreco(
  valorProposto: number,
  tempoEstimado: number,
  custoOperacional: number,
  fatoresAnalise: any = {}
): Promise<AnalisePreco> {
  const hh = await calcularHH();
  const custoRealServico = custoOperacional;
  const valorIdeal = hh.hh_ideal * tempoEstimado;
  const margemEstimada = valorProposto > 0 ? ((valorProposto - custoRealServico) / valorProposto) * 100 : 0;
  const lucroEstimado = valorProposto - custoRealServico;

  let status: "saudavel" | "margem_baixa" | "risco_prejuizo" = "saudavel";
  let recomendacao = "✅ Preço saudável";

  if (margemEstimada < hh.margem_aplicada * 0.5) {
    status = "risco_prejuizo";
    recomendacao = "🔴 Risco de prejuízo! Considere aumentar o valor.";
  } else if (margemEstimada < hh.margem_aplicada) {
    status = "margem_baixa";
    recomendacao = "🟡 Margem baixa. Valor recomendado: R$ " + valorIdeal.toFixed(2);
  }

  return {
    status,
    margem_estimada: Math.round(margemEstimada * 100) / 100,
    lucro_estimado: Math.round(lucroEstimado * 100) / 100,
    custo_operacional: custoOperacional,
    custo_real_servico: custoRealServico,
    valor_ideal_recomendado: Math.round(valorIdeal * 100) / 100,
    recomendacao,
    fatores_analisados: fatoresAnalise,
  };
}

// ========== SIMULADOR DE ORÇAMENTO ==========

export async function simularOrcamento(params: SimuladorOrcamento): Promise<ResultadoSimulador> {
  const hh = await calcularHH();

  // Calcular variações dinâmicas
  let multiplicadorHH = 1;

  // Urgência: +20%
  if (params.urgencia) multiplicadorHH += 0.2;

  // Horário noturno: +30%
  if (params.horario === "noturno") multiplicadorHH += 0.3;
  if (params.horario === "madrugada") multiplicadorHH += 0.5;

  // Fim de semana: +25%
  if (params.dia_semana === "sabado" || params.dia_semana === "domingo") multiplicadorHH += 0.25;

  // Dificuldade técnica: até +40%
  multiplicadorHH += (params.dificuldade_tecnica / 5) * 0.4;

  // Risco do serviço: até +30%
  multiplicadorHH += (params.risco_servico / 5) * 0.3;

  // Deslocamento: +R$ 5 por km
  const custoDeslocamento = params.deslocamento * 5;

  // Calcular valores
  const hhAjustado = hh.hh_ideal * multiplicadorHH;
  const valorMinimo = (hh.hh_minimo * multiplicadorHH + custoDeslocamento) * params.tempo_estimado;
  const valorRecomendado = (hhAjustado + custoDeslocamento) * params.tempo_estimado;
  const valorPremium = valorRecomendado * 1.3;

  const custoOperacional = custoDeslocamento + (params.urgencia ? 50 : 0);
  const margemEstimada = ((valorRecomendado - custoOperacional) / valorRecomendado) * 100;
  const lucroEstimado = valorRecomendado - custoOperacional;

  const analise = await analisarPreco(valorRecomendado, params.tempo_estimado, custoOperacional, {
    regiao: params.cidade,
    deslocamento: params.deslocamento,
    urgencia: params.urgencia,
    dificuldade_tecnica: params.dificuldade_tecnica,
    risco_servico: params.risco_servico,
    tempo_estimado: params.tempo_estimado,
  });

  return {
    hh_ideal: Math.round(hhAjustado * 100) / 100,
    valor_minimo: Math.round(valorMinimo * 100) / 100,
    valor_recomendado: Math.round(valorRecomendado * 100) / 100,
    valor_premium: Math.round(valorPremium * 100) / 100,
    margem_estimada: Math.round(margemEstimada * 100) / 100,
    lucro_estimado: Math.round(lucroEstimado * 100) / 100,
    custo_operacional: custoOperacional,
    analise,
  };
}
