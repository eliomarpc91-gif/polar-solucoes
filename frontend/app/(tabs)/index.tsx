import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, {
  Polyline,
  Polygon,
  Circle as SvgCircle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  G,
  Path,
  Text as SvgText,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getEmpresa,
  getCobrancas,
  getOrcamentos,
  getOrdens,
  getClientes,
  getSaidasManuais,
  EmpresaConfig,
} from "@/lib/store";
import { verificarCobrancasVencidas } from "@/lib/notificacoes-vencimento";
import { WeatherWidget } from "@/components/weather-widget";
import {
  NotificacoesInteligentes,
  type NotifData,
} from "@/components/notificacoes-inteligentes";

const { width: SCREEN_W } = Dimensions.get("window");

const COLORS = {
  primary: "#0A6EFF",
  primaryDark: "#0858CC",
  grafite: "#1F2937",
  white: "#FFFFFF",
  bg: "#F5F8FF",
  card: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  green: "#10B981",
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  border: "#E5E7EB",
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function initials(name?: string) {
  if (!name) return "??";
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataExtenso(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null);
  const [cobrancas, setCobrancas] = useState<any[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [notifBadge, setNotifBadge] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadAll = useCallback(async () => {
    const [emp, cobs, orcs, oss, cls, sas, evs] = await Promise.all([
      getEmpresa(),
      getCobrancas(),
      getOrcamentos(),
      getOrdens(),
      getClientes(),
      getSaidasManuais(),
      (await import("@/lib/store")).getEventos(),
    ]);
    setEmpresa(emp);
    setCobrancas(Array.isArray(cobs) ? cobs : []);
    setOrcamentos(Array.isArray(orcs) ? orcs : []);
    setOrdens(Array.isArray(oss) ? oss : []);
    setClientes(Array.isArray(cls) ? cls : []);
    setSaidas(Array.isArray(sas) ? sas : []);
    setEventos(Array.isArray(evs) ? evs : []);
    try {
      verificarCobrancasVencidas(cobs || []);
    } catch {}
    const pendentes = (cobs || []).filter(
      (c: any) => c.status === "pendente" || c.status === "vencido"
    ).length;
    const orcsAbertos = (orcs || []).filter(
      (o: any) => o.status === "enviado" || o.status === "rascunho" || !o.status
    ).length;
    const todayStr = new Date().toISOString().split("T")[0];
    const agendHoje = (oss || []).filter((o: any) =>
      o.dataAgendada?.startsWith(todayStr),
    ).length;
    const osAndamento = (oss || []).filter(
      (o: any) =>
        o.status !== "concluida" && o.status !== "concluído" && o.status !== "cancelada",
    ).length;
    setNotifBadge(pendentes + orcsAbertos + agendHoje + osAndamento);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, [loadAll])
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ====== Métricas ======
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  const ontemStr = new Date(hoje.getTime() - 86400000).toISOString().split("T")[0];
  const amanhaStr = new Date(hoje.getTime() + 86400000).toISOString().split("T")[0];

  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const inicioMes = new Date(anoAtual, mesAtual, 1).toISOString().split("T")[0];
  const inicioMesAnt = new Date(anoAtual, mesAtual - 1, 1).toISOString().split("T")[0];
  const fimMesAnt = new Date(anoAtual, mesAtual, 0).toISOString().split("T")[0];
  const inicioSemana = new Date(hoje.getTime() - 7 * 86400000).toISOString().split("T")[0];

  // Faturamento do mês = cobranças pagas no mês
  const faturamentoMes = cobrancas
    .filter(
      (c) => c.status === "pago" && c.dataPagamento && c.dataPagamento >= inicioMes
    )
    .reduce((s, c) => s + (c.valorTotal || 0), 0);

  const faturamentoMesAnt = cobrancas
    .filter(
      (c) =>
        c.status === "pago" &&
        c.dataPagamento &&
        c.dataPagamento >= inicioMesAnt &&
        c.dataPagamento <= fimMesAnt
    )
    .reduce((s, c) => s + (c.valorTotal || 0), 0);

  const varFatMes =
    faturamentoMesAnt > 0
      ? Math.round(((faturamentoMes - faturamentoMesAnt) / faturamentoMesAnt) * 100)
      : faturamentoMes > 0
        ? 100
        : 0;

  // OS abertas / concluídas — normaliza para aceitar todas as variações
  const isOSConcluida = (s: string | undefined) => {
    const n = (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n === "concluido" || n === "concluida";
  };
  const isOSCancelada = (s: string | undefined) => {
    const n = (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n === "cancelado" || n === "cancelada";
  };
  const osAbertas = ordens.filter((o) => !isOSConcluida(o.status) && !isOSCancelada(o.status)).length;

  const osConcluidas = ordens.filter((o) => isOSConcluida(o.status)).length;

  const osConcluidasSemana = ordens.filter(
    (o) => isOSConcluida(o.status) && (o.dataConclusao || o.dataAtualizacao || "") >= inicioSemana,
  ).length;

  const osVencendoHoje = ordens.filter(
    (o) =>
      !isOSConcluida(o.status) &&
      !isOSCancelada(o.status) &&
      o.dataAgendada?.startsWith(hojeStr)
  ).length;

  // Clientes ativos
  const clientesAtivos = clientes.length;
  const clientesNovosMes = clientes.filter(
    (c) => c.criadoEm && c.criadoEm >= inicioMes
  ).length;

  // Cobranças pendentes
  const cobrancasPendentes = cobrancas.filter(
    (c) => c.status === "pendente" || c.status === "vencido" || c.status === "parcial"
  ).length;

  // Agendamentos amanhã
  const agendamentosAmanha =
    ordens.filter((o) => o.dataAgendada?.startsWith(amanhaStr)).length +
    eventos.filter((e: any) => (e.data || "") === amanhaStr).length;

  // ===== FINANCEIRO HOJE =====
  // Soma pagamentos FULL (cobrança marcada como paga hoje) + pagamentos PARCIAIS feitos hoje
  const somaEntradasNoDia = (diaStr: string): number => {
    let total = 0;
    for (const c of cobrancas) {
      // Pagamento integral concluído nesse dia
      if (c.status === "pago" && (c.dataPagamento || "").startsWith(diaStr)) {
        // Se houver parciais, soma apenas o valor que NÃO foi parcial (evita dupla contagem)
        const parciais = ((c as any).pagamentosParciais || []) as any[];
        const somaParciais = parciais.reduce((s, p) => s + (p.valor || 0), 0);
        total += Math.max(0, (c.valorTotal || 0) - somaParciais);
      }
      // Pagamentos parciais registrados nesse dia
      const parciais = ((c as any).pagamentosParciais || []) as any[];
      for (const p of parciais) {
        if ((p.data || "").startsWith(diaStr)) {
          total += p.valor || 0;
        }
      }
    }
    return total;
  };
  const entradasHoje = somaEntradasNoDia(hojeStr);
  const entradasOntem = somaEntradasNoDia(ontemStr);
  const saidasHoje = saidas
    .filter((s) => s.data === hojeStr)
    .reduce((s, x) => s + (x.valor || 0), 0);
  const saidasOntem = saidas
    .filter((s) => s.data === ontemStr)
    .reduce((s, x) => s + (x.valor || 0), 0);
  const lucroHoje = entradasHoje - saidasHoje;
  const lucroOntem = entradasOntem - saidasOntem;

  const varEntradas = entradasOntem > 0
    ? Math.round(((entradasHoje - entradasOntem) / entradasOntem) * 100)
    : entradasHoje > 0 ? 100 : 0;
  const varSaidas = saidasOntem > 0
    ? Math.round(((saidasHoje - saidasOntem) / saidasOntem) * 100)
    : saidasHoje > 0 ? 100 : 0;
  const varLucro = lucroOntem !== 0
    ? Math.round(((lucroHoje - lucroOntem) / Math.abs(lucroOntem)) * 100)
    : lucroHoje > 0 ? 100 : 0;

  // ===== Mini gráficos (últimos 7 dias) =====
  const make7Days = (filterFn: (dia: string) => number) => {
    const arr: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 86400000);
      arr.push(filterFn(d.toISOString().split("T")[0]));
    }
    return arr;
  };

  const entradas7 = useMemo(
    () => make7Days((dia) => somaEntradasNoDia(dia)),
    [cobrancas]
  );
  const saidas7 = useMemo(
    () =>
      make7Days((dia) =>
        saidas.filter((s) => s.data === dia).reduce((s, x) => s + (x.valor || 0), 0)
      ),
    [saidas]
  );
  const lucro7 = entradas7.map((v, i) => v - saidas7[i]);

  // ===== Evolução 30 dias =====
  const evol30 = useMemo(() => {
    const dias: { dia: string; fat: number; os: number; lucro: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 86400000);
      const ymd = d.toISOString().split("T")[0];
      const fat = somaEntradasNoDia(ymd);
      const sai = saidas
        .filter((s) => s.data === ymd)
        .reduce((s, x) => s + (x.valor || 0), 0);
      const os = ordens.filter(
        (o) =>
          (o.status === "concluida" || o.status === "concluído") &&
          (o.dataConclusao || o.dataAtualizacao || "").startsWith(ymd)
      ).length;
      dias.push({
        dia: `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`,
        fat,
        os: os * 1000, // escala para visual
        lucro: fat - sai,
      });
    }
    return dias;
  }, [cobrancas, ordens, saidas]);

  // ===== Ranking de serviços =====
  const ranking = useMemo(() => {
    const counts: Record<string, number> = {};
    ordens.forEach((o) => {
      const cat = (o.tipoServico || o.categoria || "Manutenção").toString();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const fallback = [
      { label: "Carga de Gás", value: 35, color: COLORS.primary },
      { label: "Manutenção", value: 28, color: COLORS.green },
      { label: "Instalação", value: 22, color: COLORS.orange },
      { label: "Troca Compressor", value: 15, color: COLORS.purple },
    ];
    if (total === 0) return fallback;
    const palette = [COLORS.primary, COLORS.green, COLORS.orange, COLORS.purple];
    return sorted.map(([label, count], i) => ({
      label,
      value: Math.round((count / total) * 100),
      color: palette[i % palette.length],
    }));
  }, [ordens]);

  // ===== Meta do mês =====
  const metaMensal = empresa?.metaMensal || 15000;
  const progresso = Math.min((faturamentoMes / metaMensal) * 100, 100);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* HEADER GRADIENTE COM MARCA D'ÁGUA */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: 70,
            position: "relative",
          }}
        >
          {/* Marca d'água (logo Polar real) */}
          <Image
            source={require("@/assets/images/polar-logo.png")}
            style={{
              position: "absolute",
              right: -40,
              top: 20,
              width: 280,
              height: 280,
              opacity: 0.07,
            }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />

          {/* Top row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("@/assets/images/polar-logo.png")}
                style={{ width: 44, height: 44, borderRadius: 10 }}
                resizeMode="contain"
              />
              <View style={{ marginLeft: 10 }}>
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 16,
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  POLAR
                </Text>
                <Text style={{ color: "#C7DAFF", fontSize: 10, fontWeight: "600" }}>
                  SOLUÇÕES
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable
                onPress={() => router.push("/notificacoes-lista")}
                testID="header-bell"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="notifications-none" size={20} color="#FFF" />
                {notifBadge > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: COLORS.red,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "700" }}>
                      {notifBadge}
                    </Text>
                  </View>
                )}
              </Pressable>

              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 2,
                  borderColor: "#FFF",
                  backgroundColor: COLORS.primaryDark,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
                  {initials(empresa?.tecnicoResponsavel || empresa?.nome || "Eliomar")}
                </Text>
              </View>
            </View>
          </View>

          {/* Saudação */}
          <View style={{ marginTop: 18 }}>
            <Text style={{ color: "#FFF", fontSize: 13 }}>
              👋 {saudacao()},{" "}
              <Text style={{ fontWeight: "800", fontSize: 22 }}>
                {empresa?.tecnicoResponsavel?.split(" ")[0] || "Eliomar"}!
              </Text>
            </Text>
            <Text style={{ color: "#C7DAFF", fontSize: 12, marginTop: 4 }}>
              Resumo operacional da {empresa?.nome || "Polar Soluções"}
            </Text>
          </View>

          {/* Data + Clima */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <MaterialIcons name="calendar-today" size={14} color="#FFF" />
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
                {dataExtenso(hoje)}
              </Text>
            </View>
            <WeatherWidget />
          </View>
        </LinearGradient>

        {/* Conteúdo - sobrepõe o header */}
        <Animated.View
          style={{
            paddingHorizontal: 16,
            marginTop: -50,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Notificações Inteligentes */}
          <NotificacoesInteligentes
            data={{
              cobrancas: cobrancasPendentes,
              orcamentos: orcamentos.filter(
                (o) => o.status === "enviado" || o.status === "rascunho" || !o.status,
              ).length,
              agendamentos: ordens.filter((o) => o.dataAgendada?.startsWith(hojeStr))
                .length,
              osAndamento: osAbertas,
            }}
          />
          <View style={{ height: 10 }} />

          {/* RESUMO OPERACIONAL */}
          <SectionCard>
            <SectionHeader
              title="RESUMO OPERACIONAL"
              actionLabel="Ver detalhes"
              onAction={() => router.push("/dashboard-empresarial")}
            />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: -6,
              }}
            >
              <ResumoCard
                icon="attach-money"
                iconBg={COLORS.primary}
                title="FATURAMENTO"
                subtitle="MÊS"
                value={brl(faturamentoMes)}
                hint={
                  varFatMes >= 0
                    ? `↑ ${varFatMes}% vs mês anterior`
                    : `↓ ${Math.abs(varFatMes)}% vs mês anterior`
                }
                hintColor={varFatMes >= 0 ? COLORS.green : COLORS.red}
                valueColor={COLORS.primary}
              />
              <ResumoCard
                icon="build"
                iconBg={COLORS.orange}
                title="OS ABERTAS"
                subtitle=""
                value={String(osAbertas)}
                hint={`${osVencendoHoje} vencendo hoje`}
                hintColor={COLORS.orange}
                valueColor={COLORS.orange}
              />
              <ResumoCard
                icon="check"
                iconBg={COLORS.green}
                title="OS CONCLUÍDAS"
                subtitle=""
                value={String(osConcluidas)}
                hint={`+${osConcluidasSemana} esta semana`}
                hintColor={COLORS.green}
                valueColor={COLORS.green}
              />
              <ResumoCard
                icon="people"
                iconBg={COLORS.purple}
                title="CLIENTES"
                subtitle="ATIVOS"
                value={String(clientesAtivos)}
                hint={`+${clientesNovosMes} novos este mês`}
                hintColor={COLORS.purple}
                valueColor={COLORS.purple}
              />
            </View>
          </SectionCard>

          {/* SERVIÇOS PRIORITÁRIOS */}
          <SectionCard>
            <SectionHeader
              title="SERVIÇOS PRIORITÁRIOS"
              actionLabel="Ver todas"
              onAction={() => router.push("/os")}
            />
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 6,
              }}
            >
              <PrioridadeCard
                count={osVencendoHoje}
                icon="schedule"
                bg="#FEE2E2"
                iconColor={COLORS.red}
                title="OS VENCENDO HOJE"
                subtitle="Atenção necessária!"
                onPress={() => router.push("/os")}
              />
              <PrioridadeCard
                count={cobrancasPendentes}
                icon="receipt"
                bg="#FFEDD5"
                iconColor={COLORS.orange}
                title="COBRANÇAS PENDENTES"
                subtitle="Aguardando pagamento"
                onPress={() => router.push("/cobrancas")}
              />
              <PrioridadeCard
                count={agendamentosAmanha}
                icon="event"
                bg="#DCFCE7"
                iconColor={COLORS.green}
                title="AGENDAMENTOS AMANHÃ"
                subtitle="Fique preparado!"
                onPress={() => router.push("/agenda")}
              />
            </View>
          </SectionCard>

          {/* RENTABILIDADE - Card destaque */}
          <Pressable
            onPress={() => router.push("/rentabilidade")}
            style={({ pressed }) => [{
              backgroundColor: "#0D3B66",
              marginHorizontal: 20,
              marginBottom: 16,
              borderRadius: 16,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#0D3B66",
              shadowOpacity: 0.25,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }]}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="trending-up" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>📊 Rentabilidade dos Serviços</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 3 }}>
                IA analisa lucro, ranking, alertas e sugere reajustes
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#fff" />
          </Pressable>

          {/* FINANCEIRO DE HOJE */}
          <SectionCard>
            <SectionHeader
              title="FINANCEIRO — HOJE"
              actionLabel="Ver financeiro"
              onAction={() => router.push("/fluxo-caixa")}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <FinanceCard
                icon="arrow-downward"
                iconBg={COLORS.green}
                title="ENTRADAS"
                subtitle="HOJE"
                value={brl(entradasHoje)}
                trend={
                  varEntradas >= 0
                    ? `+${varEntradas}% vs ontem`
                    : `${varEntradas}% vs ontem`
                }
                trendColor={varEntradas >= 0 ? COLORS.green : COLORS.red}
                chart={entradas7}
                chartColor={COLORS.green}
              />
              <FinanceCard
                icon="arrow-upward"
                iconBg={COLORS.red}
                title="SAÍDAS"
                subtitle="HOJE"
                value={brl(saidasHoje)}
                trend={
                  varSaidas >= 0
                    ? `+${varSaidas}% vs ontem`
                    : `${varSaidas}% vs ontem`
                }
                trendColor={varSaidas <= 0 ? COLORS.green : COLORS.red}
                chart={saidas7}
                chartColor={COLORS.red}
              />
              <FinanceCard
                icon="attach-money"
                iconBg={COLORS.primary}
                title="LUCRO"
                subtitle="HOJE"
                value={brl(lucroHoje)}
                trend={
                  varLucro >= 0
                    ? `+${varLucro}% vs ontem`
                    : `${varLucro}% vs ontem`
                }
                trendColor={varLucro >= 0 ? COLORS.green : COLORS.red}
                chart={lucro7}
                chartColor={COLORS.primary}
              />
            </View>
          </SectionCard>

          {/* ATALHOS RÁPIDOS */}
          <Text
            style={{
              color: COLORS.grafite,
              fontWeight: "800",
              fontSize: 13,
              letterSpacing: 0.5,
              marginTop: 4,
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            ATALHOS RÁPIDOS
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
          >
            <AtalhoButton
              colors={[COLORS.primary, COLORS.primaryDark]}
              icon="add"
              label={"NOVA\nOS"}
              onPress={() => router.push("/os/nova" as any)}
            />
            <AtalhoButton
              colors={["#06B6D4", "#0891B2"]}
              icon="description"
              label={"NOVO\nORÇAMENTO"}
              onPress={() => router.push("/orcamento/novo" as any)}
            />
            <AtalhoButton
              colors={[COLORS.green, "#059669"]}
              icon="person-add"
              label={"NOVO\nCLIENTE"}
              onPress={() => router.push("/cliente/novo" as any)}
            />
            <AtalhoButton
              colors={[COLORS.yellow, COLORS.orange]}
              icon="attach-money"
              label={"NOVA\nCOBRANÇA"}
              onPress={() => router.push("/cobrancas/nova" as any)}
            />
            <AtalhoButton
              colors={[COLORS.purple, "#6D28D9"]}
              icon="event"
              label={"AGENDAR\nSERVIÇO"}
              onPress={() => router.push("/agenda" as any)}
            />
          </ScrollView>

          {/* EVOLUÇÃO + RANKING */}
          <View style={{ height: 16 }} />
          <SectionCard>
            <Text
              style={{
                color: COLORS.grafite,
                fontSize: 13,
                fontWeight: "800",
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              EVOLUÇÃO — ÚLTIMOS 30 DIAS
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 }}>
              <Legend color={COLORS.primary} label="Faturamento" />
              <Legend color={COLORS.green} label="OS Finalizadas" />
              <Legend color={COLORS.purple} label="Lucro" />
            </View>
            <MultiLineChart data={evol30} />
          </SectionCard>

          <SectionCard>
            <Text
              style={{
                color: COLORS.grafite,
                fontSize: 13,
                fontWeight: "800",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              RANKING DE SERVIÇOS
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <DonutChart data={ranking} />
              <View style={{ flex: 1, gap: 8 }}>
                {ranking.map((r) => (
                  <View
                    key={r.label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: r.color,
                        }}
                      />
                      <Text style={{ color: COLORS.grafite, fontSize: 12, fontWeight: "600" }}>
                        {r.label}
                      </Text>
                    </View>
                    <Text style={{ color: r.color, fontSize: 13, fontWeight: "800" }}>
                      {r.value}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          {/* META DO MÊS */}
          <Pressable
            onPress={() => router.push("/configuracoes")}
            testID="card-meta-mes"
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 18,
                marginBottom: 16,
                shadowColor: COLORS.primary,
                shadowOpacity: 0.25,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialIcons name="track-changes" size={18} color="#FFF" />
                  <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 }}>
                    META DO MÊS
                  </Text>
                </View>
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>
                  {brl(metaMensal)} <Text style={{ color: "#C7DAFF", fontSize: 10 }}>Meta</Text>
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 14,
                }}
              >
                <View>
                  <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "900" }}>
                    {brl(faturamentoMes)}
                  </Text>
                  <Text style={{ color: "#C7DAFF", fontSize: 11 }}>Atual</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "900" }}>
                    {progresso.toFixed(0)}%
                  </Text>
                  <Text style={{ color: "#C7DAFF", fontSize: 11 }}>Concluído</Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 12,
                  height: 8,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${progresso}%`,
                    height: "100%",
                    backgroundColor: "#FFF",
                    borderRadius: 4,
                  }}
                />
              </View>
            </LinearGradient>
          </Pressable>

          {/* BANNER INSTITUCIONAL */}
          <LinearGradient
            colors={[COLORS.primary, COLORS.grafite]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 16,
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "800" }}>
                  Soluções completas em refrigeração e climatização
                </Text>
                <Text style={{ color: "#C7DAFF", fontSize: 11, marginTop: 4 }}>
                  Qualidade que você sente, conforto que você confia!
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {[
                    "Ar-condicionado",
                    "Freezers",
                    "Geladeiras",
                    "Câmaras Frias",
                    "Máquinas de Gelo",
                  ].map((s) => (
                    <View
                      key={s}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.18)",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "600" }}>
                        {s}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <Image
                source={require("@/assets/images/polar-logo.png")}
                style={{ width: 70, height: 70, opacity: 0.9 }}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =================== Subcomponentes ===================

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: COLORS.grafite,
          fontSize: 13,
          fontWeight: "800",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: "700" }}>
              {actionLabel}
            </Text>
            <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

function ResumoCard({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  hint,
  hintColor,
  valueColor,
}: any) {
  const cardW = (SCREEN_W - 32 - 32) / 2 - 6;
  return (
    <View
      style={{
        width: cardW,
        margin: 6,
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name={icon} size={16} color="#FFF" />
        </View>
        <View>
          <Text style={{ color: COLORS.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.5 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: COLORS.muted, fontSize: 9 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Text
        style={{
          color: valueColor,
          fontSize: 22,
          fontWeight: "900",
          marginTop: 8,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={{ color: hintColor, fontSize: 10, fontWeight: "600", marginTop: 4 }}>
        {hint}
      </Text>
    </View>
  );
}

function PrioridadeCard({
  count,
  icon,
  bg,
  iconColor,
  title,
  subtitle,
  onPress,
}: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: bg,
        borderRadius: 16,
        padding: 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: iconColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name={icon} size={15} color="#FFF" />
        </View>
        <Text style={{ color: iconColor, fontSize: 22, fontWeight: "900" }}>
          {count}
        </Text>
      </View>
      <Text
        style={{
          color: COLORS.grafite,
          fontSize: 10,
          fontWeight: "800",
          marginTop: 8,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Text>
      <Text style={{ color: COLORS.muted, fontSize: 9, marginTop: 2 }}>{subtitle}</Text>
    </Pressable>
  );
}

function FinanceCard({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  trend,
  trendColor,
  chart,
  chartColor,
}: any) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name={icon} size={14} color="#FFF" />
        </View>
        <View>
          <Text style={{ color: COLORS.muted, fontSize: 9, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 8 }}>{subtitle}</Text>
        </View>
      </View>
      <Text
        style={{
          color: chartColor,
          fontSize: 15,
          fontWeight: "900",
          marginTop: 8,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <View style={{ marginTop: 4 }}>
        <MiniSparkline data={chart} color={chartColor} />
      </View>
      <Text style={{ color: trendColor, fontSize: 9, fontWeight: "700", marginTop: 2 }}>
        {trend}
      </Text>
    </View>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 90;
  const h = 24;
  if (!data || data.length < 2)
    return <View style={{ height: h }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `${pts} ${w},${h} 0,${h}`;
  return (
    <Svg height={h} width={w}>
      <Defs>
        <SvgLinearGradient id={`sp-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      <Polygon points={area} fill={`url(#sp-${color.replace("#", "")})`} />
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AtalhoButton({
  colors,
  icon,
  label,
  onPress,
}: {
  colors: [string, string];
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} testID={`atalho-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 110,
          height: 100,
          borderRadius: 18,
          padding: 12,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors[0],
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.25)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name={icon as any} size={20} color="#FFF" />
        </View>
        <Text
          style={{
            color: "#FFF",
            fontSize: 11,
            fontWeight: "800",
            textAlign: "center",
            marginTop: 6,
            lineHeight: 13,
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function MultiLineChart({ data }: { data: { dia: string; fat: number; os: number; lucro: number }[] }) {
  const w = SCREEN_W - 32 - 32;
  const h = 180;
  const padding = 28;

  const allValues = data.flatMap((d) => [d.fat, d.os, d.lucro]);
  const max = Math.max(...allValues, 1);
  const min = 0;
  const range = max - min || 1;

  const xStep = (w - padding) / Math.max(data.length - 1, 1);
  const yScale = (v: number) => h - 24 - ((v - min) / range) * (h - 40);
  const xScale = (i: number) => padding + i * xStep;

  const makePoints = (key: "fat" | "os" | "lucro") =>
    data.map((d, i) => `${xScale(i)},${yScale(d[key])}`).join(" ");

  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];

  // Labels do eixo X - mostrar 5 datas
  const labelStep = Math.floor(data.length / 5);

  return (
    <Svg width={w} height={h}>
      {/* Linhas de grid */}
      {ticks.map((t, i) => (
        <Line
          key={i}
          x1={padding}
          x2={w}
          y1={yScale(t)}
          y2={yScale(t)}
          stroke={COLORS.border}
          strokeDasharray="2,4"
          strokeWidth="1"
        />
      ))}
      {/* Ticks Y */}
      {ticks.map((t, i) => (
        <SvgText
          key={`yt-${i}`}
          x={0}
          y={yScale(t) + 4}
          fontSize="9"
          fill={COLORS.muted}
        >
          {t >= 1000 ? `${Math.round(t / 1000)}k` : `${Math.round(t)}`}
        </SvgText>
      ))}
      {/* Linhas */}
      <Polyline
        points={makePoints("fat")}
        stroke={COLORS.primary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points={makePoints("os")}
        stroke={COLORS.green}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points={makePoints("lucro")}
        stroke={COLORS.purple}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pontos finais */}
      {data.length > 0 && (
        <G>
          <SvgCircle cx={xScale(data.length - 1)} cy={yScale(data[data.length - 1].fat)} r="3" fill={COLORS.primary} />
          <SvgCircle cx={xScale(data.length - 1)} cy={yScale(data[data.length - 1].os)} r="3" fill={COLORS.green} />
          <SvgCircle cx={xScale(data.length - 1)} cy={yScale(data[data.length - 1].lucro)} r="3" fill={COLORS.purple} />
        </G>
      )}
      {/* Labels X */}
      {data.map((d, i) =>
        i % labelStep === 0 || i === data.length - 1 ? (
          <SvgText
            key={`xt-${i}`}
            x={xScale(i)}
            y={h - 6}
            fontSize="9"
            fill={COLORS.muted}
            textAnchor="middle"
          >
            {d.dia}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const size = 100;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let acc = 0;
  return (
    <Svg width={size} height={size}>
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={COLORS.border}
        strokeWidth={stroke}
        fill="none"
      />
      {data.map((d, i) => {
        const len = (d.value / total) * c;
        const dasharray = `${len} ${c - len}`;
        const offset = c - acc;
        acc += len;
        return (
          <SvgCircle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={d.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={dasharray}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
      })}
    </Svg>
  );
}
