import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, getClientes, getOrcamentos } from "@/lib/store";

export default function RelatoriosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOS: 0,
    osAbertas: 0,
    osAndamento: 0,
    osConcluidas: 0,
    osPendentes: 0,
    totalClientes: 0,
    totalOrcamentos: 0,
    orcAprovados: 0,
    orcRejeitados: 0,
    faturamento: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    const clientes = await getClientes();
    const orcamentos = await getOrcamentos();

    setStats({
      totalOS: ordens.length,
      osAbertas: ordens.filter((o) => o.status === "aberto").length,
      osAndamento: ordens.filter((o) => o.status === "em_andamento").length,
      osConcluidas: ordens.filter((o) => o.status === "concluido").length,
      osPendentes: ordens.filter((o) => o.status === "pendente").length,
      totalClientes: clientes.length,
      totalOrcamentos: orcamentos.length,
      orcAprovados: orcamentos.filter((o) => o.status === "aprovado").length,
      orcRejeitados: orcamentos.filter((o) => o.status === "rejeitado").length,
      faturamento: ordens
        .filter((o) => o.status === "concluido")
        .reduce((sum, o) => sum + o.valorTotal, 0),
    });
  };

  const StatRow = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text className="text-muted text-sm">{label}</Text>
      <Text style={{ color: color || colors.foreground, fontSize: 14, fontWeight: "600" }}>
        {value}
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Relatórios</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* OS Stats */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-foreground text-base font-semibold mb-2">Ordens de Serviço</Text>
          <StatRow label="Total de OS" value={stats.totalOS} />
          <StatRow label="Abertas" value={stats.osAbertas} color={colors.primary} />
          <StatRow label="Em Andamento" value={stats.osAndamento} color={colors.warning} />
          <StatRow label="Concluídas" value={stats.osConcluidas} color={colors.success} />
          <StatRow label="Pendentes" value={stats.osPendentes} color={colors.error} />
        </View>

        {/* Clientes */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-foreground text-base font-semibold mb-2">Clientes</Text>
          <StatRow label="Total de Clientes" value={stats.totalClientes} />
        </View>

        {/* Orçamentos */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-foreground text-base font-semibold mb-2">Orçamentos</Text>
          <StatRow label="Total" value={stats.totalOrcamentos} />
          <StatRow label="Aprovados" value={stats.orcAprovados} color={colors.success} />
          <StatRow label="Rejeitados" value={stats.orcRejeitados} color={colors.error} />
        </View>

        {/* Faturamento */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-foreground text-base font-semibold mb-2">Faturamento</Text>
          <StatRow label="Total (OS concluídas)" value={`R$ ${stats.faturamento.toFixed(2)}`} color={colors.success} />
          <StatRow
            label="Ticket Médio"
            value={`R$ ${stats.osConcluidas > 0 ? (stats.faturamento / stats.osConcluidas).toFixed(2) : "0.00"}`}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
