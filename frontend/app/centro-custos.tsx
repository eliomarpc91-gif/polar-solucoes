import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useCallback } from "react";
import { getCentroDeCustos, calcularHH, atualizarMetas } from "@/lib/hh-store";
import { CalculoHH, MetasFinanceiras } from "@/lib/hh-types";

export default function CentroCustosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [hhCalculo, setHhCalculo] = useState<CalculoHH | null>(null);
  const [metas, setMetas] = useState<MetasFinanceiras | null>(null);
  const [editandoMetas, setEditandoMetas] = useState(false);
  const [novasMetas, setNovasMetas] = useState<Partial<MetasFinanceiras>>({});

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    const centro = await getCentroDeCustos();
    if (centro) {
      setMetas(centro.metas);
      setNovasMetas(centro.metas);
    }
    const hh = await calcularHH();
    setHhCalculo(hh);
  };

  const salvarMetas = async () => {
    const { generateId } = require('@/lib/store');
    const metasBase: MetasFinanceiras = metas || {
      id: generateId(),
      margem_minima: 30,
      lucro_desejado: 5000,
      faturamento_mensal_desejado: 50000,
      horas_produtivas_mensais: 160,
      reserva_financeira_ideal: 10000,
      atualizado_em: new Date().toISOString(),
    };
    const metasAtualizadas = { ...metasBase, ...novasMetas } as MetasFinanceiras;
    await atualizarMetas(metasAtualizadas);
    setMetas(metasAtualizadas);
    setEditandoMetas(false);
    Alert.alert("Sucesso", "Metas atualizadas com sucesso!");
    await carregarDados();
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text className="text-foreground text-2xl font-bold">Centro de Custos</Text>
          <Pressable
            onPress={() => router.push("/centro-custos/custos-fixos" as any)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="add-circle" size={28} color={colors.primary} />
          </Pressable>
        </View>

        {/* HH CALCULADO */}
        {hhCalculo && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-foreground text-lg font-bold mb-3">HH Calculado</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text className="text-muted text-xs font-semibold mb-1">HH Mínimo</Text>
                <Text className="text-foreground text-xl font-bold">R$ {hhCalculo.hh_minimo.toFixed(2)}</Text>
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text className="text-muted text-xs font-semibold mb-1">HH Ideal</Text>
                <Text className="text-foreground text-xl font-bold" style={{ color: colors.primary }}>
                  R$ {hhCalculo.hh_ideal.toFixed(2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-muted text-xs font-semibold mb-1">HH Premium</Text>
                <Text className="text-foreground text-xl font-bold" style={{ color: colors.success }}>
                  R$ {hhCalculo.hh_premium.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text className="text-muted text-sm">Custos Totais:</Text>
                <Text className="text-foreground font-semibold">R$ {hhCalculo.custos_totais_mensais.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text className="text-muted text-sm">Impostos:</Text>
                <Text className="text-foreground font-semibold">{hhCalculo.impostos_totais.toFixed(1)}%</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Horas Produtivas:</Text>
                <Text className="text-foreground font-semibold">{hhCalculo.horas_produtivas}h/mês</Text>
              </View>
            </View>
          </View>
        )}

        {/* METAS FINANCEIRAS */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text className="text-foreground text-lg font-bold">Metas Financeiras</Text>
            <Pressable
              onPress={() => setEditandoMetas(!editandoMetas)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <MaterialIcons name={editandoMetas ? "check-circle" : "edit"} size={24} color={colors.primary} />
            </Pressable>
          </View>

          {editandoMetas ? (
            <View style={{ gap: 12 }}>
              <View>
                <Text className="text-muted text-xs font-semibold mb-2">Margem Mínima (%)</Text>
                <TextInput
                  value={novasMetas.margem_minima?.toString() || ""}
                  onChangeText={(t) => setNovasMetas({ ...novasMetas, margem_minima: parseFloat(t) || 0 })}
                  placeholder="Ex: 30"
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <View>
                <Text className="text-muted text-xs font-semibold mb-2">Lucro Desejado (R$)</Text>
                <TextInput
                  value={novasMetas.lucro_desejado?.toString() || ""}
                  onChangeText={(t) => setNovasMetas({ ...novasMetas, lucro_desejado: parseFloat(t) || 0 })}
                  placeholder="Ex: 5000"
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <View>
                <Text className="text-muted text-xs font-semibold mb-2">Faturamento Mensal Desejado (R$)</Text>
                <TextInput
                  value={novasMetas.faturamento_mensal_desejado?.toString() || ""}
                  onChangeText={(t) => setNovasMetas({ ...novasMetas, faturamento_mensal_desejado: parseFloat(t) || 0 })}
                  placeholder="Ex: 50000"
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <View>
                <Text className="text-muted text-xs font-semibold mb-2">Horas Produtivas/Mês</Text>
                <TextInput
                  value={novasMetas.horas_produtivas_mensais?.toString() || ""}
                  onChangeText={(t) => setNovasMetas({ ...novasMetas, horas_produtivas_mensais: parseInt(t) || 0 })}
                  placeholder="Ex: 160"
                  keyboardType="number-pad"
                  style={inputStyle}
                />
              </View>
              <View>
                <Text className="text-muted text-xs font-semibold mb-2">Reserva Financeira Ideal (R$)</Text>
                <TextInput
                  value={novasMetas.reserva_financeira_ideal?.toString() || ""}
                  onChangeText={(t) => setNovasMetas({ ...novasMetas, reserva_financeira_ideal: parseFloat(t) || 0 })}
                  placeholder="Ex: 10000"
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <Pressable
                onPress={salvarMetas}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.background, fontWeight: "600" }}>Salvar Metas</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Margem Mínima:</Text>
                <Text className="text-foreground font-semibold">{metas?.margem_minima}%</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Lucro Desejado:</Text>
                <Text className="text-foreground font-semibold">R$ {metas?.lucro_desejado.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Faturamento Desejado:</Text>
                <Text className="text-foreground font-semibold">R$ {metas?.faturamento_mensal_desejado.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Horas Produtivas:</Text>
                <Text className="text-foreground font-semibold">{metas?.horas_produtivas_mensais}h/mês</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text className="text-muted text-sm">Reserva Ideal:</Text>
                <Text className="text-foreground font-semibold">R$ {metas?.reserva_financeira_ideal.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* MENU DE CUSTOS */}
        <Text className="text-muted text-xs font-semibold mb-3 ml-1">GERENCIAR CUSTOS</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          {[
            { icon: "attach-money", label: "Custos Fixos", route: "/centro-custos/custos-fixos", color: "#0891B2" },
            { icon: "trending-down", label: "Custos Variáveis", route: "/centro-custos/custos-variaveis", color: "#DC2626" },
            { icon: "receipt", label: "Impostos", route: "/centro-custos/impostos", color: "#7C3AED" },
            { icon: "trending-up", label: "HH Inteligente", route: "/hh-inteligente", color: "#16A34A" },
          ].map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => router.navigate(item.route as any)}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  backgroundColor: pressed ? colors.border : "transparent",
                  borderBottomWidth: index < 3 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: item.color + "15", alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text className="text-foreground text-sm font-medium flex-1 ml-3">{item.label}</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
