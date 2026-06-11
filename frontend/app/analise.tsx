import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, getOrcamentos } from "@/lib/store";

export default function AnaliseScreen() {
  const colors = useColors();
  const router = useRouter();
  const [data, setData] = useState({
    taxaConclusao: 0,
    taxaAprovacao: 0,
    tempoMedio: 0,
    osMes: 0,
    osAnterior: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    const orcamentos = await getOrcamentos();

    const total = ordens.length;
    const concluidas = ordens.filter((o) => o.status === "concluido").length;
    const taxaConclusao = total > 0 ? (concluidas / total) * 100 : 0;

    const totalOrc = orcamentos.length;
    const aprovados = orcamentos.filter((o) => o.status === "aprovado").length;
    const taxaAprovacao = totalOrc > 0 ? (aprovados / totalOrc) * 100 : 0;

    // Tempo médio de conclusão
    const osComTempo = ordens.filter((o) => o.status === "concluido" && o.concluidoEm);
    let tempoMedio = 0;
    if (osComTempo.length > 0) {
      const totalDias = osComTempo.reduce((sum, o) => {
        const inicio = new Date(o.criadoEm).getTime();
        const fim = new Date(o.concluidoEm!).getTime();
        return sum + (fim - inicio) / (1000 * 60 * 60 * 24);
      }, 0);
      tempoMedio = totalDias / osComTempo.length;
    }

    // OS do mês atual vs anterior
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();
    const osMes = ordens.filter((o) => {
      const d = new Date(o.criadoEm);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }).length;

    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    const osAnterior = ordens.filter((o) => {
      const d = new Date(o.criadoEm);
      return d.getMonth() === mesAnterior && d.getFullYear() === anoAnterior;
    }).length;

    setData({ taxaConclusao, taxaAprovacao, tempoMedio, osMes, osAnterior });
  };

  const MetricCard = ({
    icon,
    label,
    value,
    suffix,
    color,
  }: {
    icon: string;
    label: string;
    value: string;
    suffix?: string;
    color: string;
  }) => (
    <View className="bg-surface rounded-xl p-4 border border-border mb-3">
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: color + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name={icon as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text className="text-muted text-xs">{label}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 2 }}>
            <Text className="text-foreground text-xl font-bold">{value}</Text>
            {suffix && <Text className="text-muted text-sm ml-1">{suffix}</Text>}
          </View>
        </View>
      </View>
    </View>
  );

  const crescimento = data.osAnterior > 0
    ? (((data.osMes - data.osAnterior) / data.osAnterior) * 100).toFixed(0)
    : "0";

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Análise</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <MetricCard
          icon="check-circle"
          label="Taxa de Conclusão"
          value={data.taxaConclusao.toFixed(0)}
          suffix="%"
          color={colors.success}
        />
        <MetricCard
          icon="thumb-up"
          label="Taxa de Aprovação de Orçamentos"
          value={data.taxaAprovacao.toFixed(0)}
          suffix="%"
          color={colors.primary}
        />
        <MetricCard
          icon="schedule"
          label="Tempo Médio de Conclusão"
          value={data.tempoMedio.toFixed(1)}
          suffix="dias"
          color={colors.warning}
        />
        <MetricCard
          icon="trending-up"
          label="OS Este Mês"
          value={data.osMes.toString()}
          suffix={`(${Number(crescimento) >= 0 ? "+" : ""}${crescimento}%)`}
          color={Number(crescimento) >= 0 ? colors.success : colors.error}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
