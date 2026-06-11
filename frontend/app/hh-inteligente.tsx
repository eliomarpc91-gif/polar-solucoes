import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useCallback, useEffect } from "react";
import { calcularHH, simularOrcamento } from "@/lib/hh-store";
import { CalculoHH, ResultadoSimulador } from "@/lib/hh-types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MODO_INTELIGENTE_KEY = "@polar/hh_modo_inteligente";

export default function HHInteligenteScreen() {
  const colors = useColors();
  const router = useRouter();
  const [hhCalculo, setHhCalculo] = useState<CalculoHH | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [modoInteligente, setModoInteligenteState] = useState(false);

  // Carrega valor persistido na primeira render
  useEffect(() => {
    AsyncStorage.getItem(MODO_INTELIGENTE_KEY).then((v) => {
      if (v === "true") setModoInteligenteState(true);
    });
  }, []);

  const setModoInteligente = (v: boolean) => {
    setModoInteligenteState(v);
    AsyncStorage.setItem(MODO_INTELIGENTE_KEY, v ? "true" : "false").catch(() => {});
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    const hh = await calcularHH();
    setHhCalculo(hh);
  };

  const getStatusColor = (hh: CalculoHH) => {
    if (hh.hh_ideal <= 0) return colors.warning;
    if (hh.hh_ideal < 50) return colors.error;
    if (hh.hh_ideal < 100) return colors.warning;
    return colors.success;
  };

  const getStatusTexto = (hh: CalculoHH) => {
    if (hh.hh_ideal <= 0) return "⚠️ Configure custos e metas";
    if (hh.hh_ideal < 50) return "🔴 HH muito baixo";
    if (hh.hh_ideal < 100) return "🟡 HH abaixo da média";
    return "🟢 HH saudável";
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-2xl font-bold">HH Inteligente</Text>
          <View style={{ width: 24 }} />
        </View>

        {!hhCalculo ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <MaterialIcons name="warning" size={48} color={colors.warning} />
            <Text className="text-foreground text-sm mt-3 font-semibold">Configure seus custos primeiro</Text>
            <Text className="text-muted text-xs mt-2">Vá para Centro de Custos e adicione custos fixos, variáveis e metas</Text>
            <Pressable
              onPress={() => router.push("/centro-custos" as any)}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginTop: 16,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.background, fontWeight: "600", fontSize: 12 }}>Ir para Centro de Custos</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* STATUS DO HH */}
            <View style={{ backgroundColor: getStatusColor(hhCalculo) + "15", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: getStatusColor(hhCalculo) }}>
              <Text className="text-foreground text-lg font-bold mb-2">{getStatusTexto(hhCalculo)}</Text>
              <Text className="text-muted text-xs">
                Seu HH Ideal está em R$ {hhCalculo.hh_ideal.toFixed(2)}/hora. Ajuste seus custos e metas para otimizar.
              </Text>
            </View>

            {/* MODO INTELIGENTE */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text className="text-foreground text-lg font-bold">Modo Inteligente</Text>
                <Pressable
                  onPress={() => setModoInteligente(!modoInteligente)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: modoInteligente ? colors.success : colors.border,
                      width: 50,
                      height: 28,
                      borderRadius: 14,
                      justifyContent: "center",
                      alignItems: modoInteligente ? "flex-end" : "flex-start",
                      paddingHorizontal: 3,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.background }} />
                </Pressable>
              </View>
              <Text className="text-muted text-xs">
                {modoInteligente
                  ? "✅ Modo inteligente ativado. O sistema ajustará automaticamente HH, margem e deslocamento."
                  : "❌ Modo inteligente desativado. Use valores manuais."}
              </Text>
            </View>

            {/* HH CALCULADO */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-foreground text-lg font-bold mb-4">HH Calculado</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text className="text-muted text-xs font-semibold mb-2">HH Mínimo</Text>
                  <View style={{ backgroundColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" }}>
                    <Text className="text-foreground text-xl font-bold">R$ {hhCalculo.hh_minimo.toFixed(2)}</Text>
                    <Text className="text-muted text-xs mt-1">Cobre custos</Text>
                  </View>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text className="text-muted text-xs font-semibold mb-2">HH Ideal</Text>
                  <View style={{ backgroundColor: colors.primary + "20", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 2, borderColor: colors.primary }}>
                    <Text className="text-foreground text-xl font-bold" style={{ color: colors.primary }}>
                      R$ {hhCalculo.hh_ideal.toFixed(2)}
                    </Text>
                    <Text className="text-muted text-xs mt-1">Recomendado</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-muted text-xs font-semibold mb-2">HH Premium</Text>
                  <View style={{ backgroundColor: colors.success + "20", borderRadius: 10, padding: 12, alignItems: "center" }}>
                    <Text className="text-foreground text-xl font-bold" style={{ color: colors.success }}>
                      R$ {hhCalculo.hh_premium.toFixed(2)}
                    </Text>
                    <Text className="text-muted text-xs mt-1">Premium</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* DETALHES DO CÁLCULO */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-foreground text-lg font-bold mb-4">Detalhes do Cálculo</Text>

              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">Custos Totais Mensais:</Text>
                  <Text className="text-foreground font-semibold">R$ {hhCalculo.custos_totais_mensais.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">Lucro Desejado:</Text>
                  <Text className="text-foreground font-semibold">R$ {hhCalculo.lucro_desejado.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">Horas Produtivas/Mês:</Text>
                  <Text className="text-foreground font-semibold">{hhCalculo.horas_produtivas}h</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-muted text-sm">Total de Impostos:</Text>
                  <Text className="text-foreground font-semibold">{hhCalculo.impostos_totais.toFixed(1)}%</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text className="text-muted text-sm">Margem Mínima:</Text>
                  <Text className="text-foreground font-semibold">{hhCalculo.margem_aplicada.toFixed(0)}%</Text>
                </View>
              </View>
            </View>

            {/* FÓRMULA */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-foreground text-sm font-bold mb-3">Fórmula de Cálculo</Text>
              <View style={{ backgroundColor: colors.border, borderRadius: 10, padding: 12 }}>
                <Text className="text-foreground text-xs font-mono">
                  HH = (Custos + Lucro) ÷ Horas{"\n"}
                  HH = (R$ {hhCalculo.custos_totais_mensais.toFixed(2)} + R$ {hhCalculo.lucro_desejado.toFixed(2)}) ÷ {hhCalculo.horas_produtivas}h{"\n"}
                  HH = R$ {hhCalculo.hh_ideal.toFixed(2)}/hora
                </Text>
              </View>
            </View>

            {/* BOTÕES DE AÇÃO */}
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={() => router.push("/centro-custos" as any)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialIcons name="edit" size={18} color={colors.background} />
                <Text style={{ color: colors.background, fontWeight: "600", marginLeft: 8 }}>Ajustar Custos e Metas</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/simulador-orcamento" as any)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.success,
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialIcons name="calculate" size={18} color={colors.background} />
                <Text style={{ color: colors.background, fontWeight: "600", marginLeft: 8 }}>Simular Orçamento</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
