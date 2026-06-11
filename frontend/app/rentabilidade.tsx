import React, { useCallback, useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { api } from "@/lib/api-client";
import { getOrdens } from "@/lib/store";
import { calcularRentabilidadeLocal, RentabilidadeData } from "@/lib/rentabilidade-calc";

type RentabResponse = RentabilidadeData;

function brl(v: number) {
  const n = Number(v);
  const x = Number.isFinite(n) ? n : 0;
  return `R$ ${x.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function corMargem(m: number) {
  if (m >= 35) return "#10B981"; // verde
  if (m >= 20) return "#F59E0B"; // amarelo
  return "#EF4444"; // vermelho
}

export default function RentabilidadeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [data, setData] = useState<RentabResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setErro(null);
    try {
      // 1) SEMPRE calcula localmente primeiro (offline-first)
      const oss = await getOrdens();
      const local = calcularRentabilidadeLocal(oss);
      setData(local);
      setLoading(false);

      // 2) Tenta backend para enriquecer com IA (não-bloqueante)
      try {
        const online = await api.post<RentabResponse>("/rentabilidade/analise", {});
        if (online && online.kpis) {
          online.origem = "online";
          setData(online);
        }
      } catch (apiErr: any) {
        // Backend indisponível ou IA falhou → mantém dados locais sem mostrar erro
        console.warn("[rentabilidade] backend indisponível, usando cálculo offline:", apiErr?.message);
      }
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { carregar(); }, []));

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "900" }}>Rentabilidade dos Serviços</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {data?.origem === "online" ? "Análise inteligente com IA" : "Cálculo local (offline)"}
            </Text>
            {data?.origem === "offline" && (
              <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={{ color: "#92400E", fontSize: 9, fontWeight: "800" }}>OFFLINE</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable onPress={() => { setLoading(true); carregar(); }} hitSlop={6} style={{ padding: 8 }}>
          <MaterialIcons name="refresh" size={22} color="#0D3B66" />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={{ color: colors.muted, marginTop: 14, fontSize: 13 }}>Calculando rentabilidade…</Text>
        </View>
      ) : erro ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }}>
          <MaterialIcons name="error-outline" size={42} color="#EF4444" />
          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 10, textAlign: "center" }}>{erro}</Text>
        </View>
      ) : data ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#1E88E5" />}
        >
          {/* KPIs Principais */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            <KPI label="FATURAMENTO" value={brl(data.kpis.faturamentoTotal)} cor="#1E88E5" icon="trending-up" colors={colors} />
            <KPI label="LUCRO LÍQUIDO" value={brl(data.kpis.lucroTotal)} cor={data.kpis.lucroTotal >= 0 ? "#10B981" : "#EF4444"} icon="attach-money" colors={colors} />
            <KPI label="MARGEM" value={`${data.kpis.margemGlobal.toFixed(1)}%`} cor={corMargem(data.kpis.margemGlobal)} icon="pie-chart" colors={colors} />
            <KPI label="OS CONCLUÍDAS" value={String(data.kpis.qtdOSConcluidas)} cor="#0D3B66" icon="check-circle" colors={colors} />
          </View>

          {/* Mês atual vs anterior */}
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginBottom: 10 }}>📊 Comparativo mensal</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>MÊS ATUAL ({data.mes.atual.ref})</Text>
                <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 16, marginTop: 4 }}>{brl(data.mes.atual.lucro)}</Text>
                <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>{data.mes.atual.qtd} OS</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>MÊS ANTERIOR</Text>
                <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 16, marginTop: 4 }}>{brl(data.mes.anterior.lucro)}</Text>
                <Text style={{ color: data.mes.crescimentoLucro >= 0 ? "#10B981" : "#EF4444", fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                  {data.mes.crescimentoLucro >= 0 ? "▲" : "▼"} {Math.abs(data.mes.crescimentoLucro).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Insight IA */}
          {data.insightIA && (
            <View style={{ backgroundColor: "#EFF6FF", borderLeftWidth: 4, borderLeftColor: "#1E88E5", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <MaterialIcons name="auto-awesome" size={18} color="#1E88E5" />
                <Text style={{ color: "#0D3B66", fontWeight: "800", marginLeft: 6, fontSize: 13 }}>Análise IA (Claude Sonnet 4.5)</Text>
              </View>
              {renderMarkdown(data.insightIA, colors)}
            </View>
          )}

          {/* Ranking Mais Rentáveis */}
          {data.rankingMaisRentaveis.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginBottom: 8 }}>🏆 Mais rentáveis</Text>
              {data.rankingMaisRentaveis.map((s: any, i: number) => (
                <ServicoCard key={s.servico + i} pos={i + 1} servico={s} cor={i === 0 ? "#10B981" : "#1E88E5"} />
              ))}
            </View>
          )}

          {/* Ranking Menos Rentáveis */}
          {data.rankingMenosRentaveis.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginBottom: 8 }}>⚠️ Menos rentáveis</Text>
              {data.rankingMenosRentaveis.map((s: any, i: number) => (
                <ServicoCard key={s.servico + i} pos={i + 1} servico={s} cor={corMargem(s.margem)} />
              ))}
            </View>
          )}

          {/* Sugestões de Reajuste */}
          {data.sugestoesReajuste.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginBottom: 8 }}>💰 Sugestões de reajuste</Text>
              {data.sugestoesReajuste.map((s: any) => (
                <View key={s.servico} style={{ backgroundColor: "#FEFCE8", borderLeftWidth: 4, borderLeftColor: "#F59E0B", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13 }}>{s.servico}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                    Margem atual: <Text style={{ color: corMargem(s.margemAtual), fontWeight: "800" }}>{s.margemAtual.toFixed(1)}%</Text>
                  </Text>
                  <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginTop: 4 }}>
                    Reajuste sugerido: +{s.reajusteSugerido}% → {brl(s.novoPreco)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Alertas */}
          {data.alertas.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginBottom: 8 }}>🚨 Alertas</Text>
              {data.alertas.map((a: any, i: number) => (
                <View key={i} style={{ backgroundColor: a.tipo === "critico" ? "#FEE2E2" : "#FEF3C7", borderLeftWidth: 4, borderLeftColor: a.tipo === "critico" ? "#EF4444" : "#F59E0B", borderRadius: 10, padding: 12, marginBottom: 6 }}>
                  <Text style={{ color: "#0D3B66", fontWeight: "700", fontSize: 12 }}>{a.servico}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>{a.msg}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Evolução mensal — gráfico simples */}
          {data.evolucaoMensal.length > 0 && (
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#E5E7EB" }}>
              <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13, marginBottom: 10 }}>📈 Evolução mensal</Text>
              {(() => {
                const max = Math.max(...data.evolucaoMensal.map((m: any) => m.lucro), 1);
                return data.evolucaoMensal.map((m: any) => (
                  <View key={m.mes} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 }}>
                    <Text style={{ color: colors.muted, fontSize: 10, width: 60 }}>{m.mes}</Text>
                    <View style={{ flex: 1, height: 16, backgroundColor: "#F1F5F9", borderRadius: 8, overflow: "hidden" }}>
                      <View style={{ width: `${(m.lucro / max) * 100}%`, height: "100%", backgroundColor: corMargem((m.lucro / m.faturamento) * 100) }} />
                    </View>
                    <Text style={{ color: "#0D3B66", fontWeight: "700", fontSize: 10, width: 80, textAlign: "right" }}>{brl(m.lucro)}</Text>
                  </View>
                ));
              })()}
            </View>
          )}
        </ScrollView>
      ) : null}
    </ScreenContainer>
  );
}

function KPI({ label, value, cor, icon, colors }: any) {
  return (
    <View style={{ flex: 1, minWidth: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <MaterialIcons name={icon} size={16} color={cor} />
        <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "700" }}>{label}</Text>
      </View>
      <Text style={{ color: cor, fontSize: 18, fontWeight: "900", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function ServicoCard({ pos, servico, cor }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: "#E5E7EB", gap: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: cor, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>{pos}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#0D3B66", fontWeight: "800", fontSize: 13 }} numberOfLines={1}>{servico.servico}</Text>
        <Text style={{ color: "#64748B", fontSize: 10 }}>{servico.qtd} OS • Margem {servico.margem.toFixed(1)}%</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: cor, fontWeight: "900", fontSize: 13 }}>{brl(servico.lucro)}</Text>
        <Text style={{ color: "#94A3B8", fontSize: 9 }}>lucro</Text>
      </View>
    </View>
  );
}

function renderMarkdown(md: string, colors: any) {
  return md.split("\n").map((l, i) => {
    if (!l.trim()) return <View key={i} style={{ height: 6 }} />;
    if (l.startsWith("## ")) return <Text key={i} style={{ color: "#0D3B66", fontWeight: "900", fontSize: 14, marginTop: 6 }}>{l.replace(/^##\s+/, "").replace(/\*\*/g, "")}</Text>;
    const parts = l.replace(/^[-*]\s+/, "• ").split(/(\*\*[^*]+\*\*)/);
    return (
      <Text key={i} style={{ color: colors.foreground, fontSize: 12, lineHeight: 18, marginBottom: 2 }}>
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <Text key={j} style={{ fontWeight: "800", color: "#0D3B66" }}>{p.slice(2, -2)}</Text>
          ) : (
            <Text key={j}>{p}</Text>
          ),
        )}
      </Text>
    );
  });
}
