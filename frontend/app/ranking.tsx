import { useState, useCallback } from "react";
import { FlatList, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, getClientes } from "@/lib/store";

interface ClienteRank {
  id: string;
  nome: string;
  totalOS: number;
  faturamento: number;
}

export default function RankingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [ranking, setRanking] = useState<ClienteRank[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    const clientes = await getClientes();

    const rankMap: { [id: string]: ClienteRank } = {};
    for (const c of clientes) {
      rankMap[c.id] = { id: c.id, nome: c.nome, totalOS: 0, faturamento: 0 };
    }
    for (const os of ordens) {
      if (rankMap[os.clienteId]) {
        rankMap[os.clienteId].totalOS++;
        if (os.status === "concluido") {
          rankMap[os.clienteId].faturamento += os.valorTotal;
        }
      }
    }

    const sorted = Object.values(rankMap)
      .filter((c) => c.totalOS > 0)
      .sort((a, b) => b.faturamento - a.faturamento);

    setRanking(sorted);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Ranking de Clientes</Text>
      </View>

      <FlatList
        data={ranking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <MaterialIcons name="leaderboard" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3">Nenhum dado disponível</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/cliente/${item.id}` as any)}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? colors.border : colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: index < 3 ? colors.warning + "30" : colors.muted + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: index < 3 ? colors.warning : colors.muted,
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                {index + 1}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text className="text-foreground font-semibold text-sm">{item.nome}</Text>
              <Text className="text-muted text-xs mt-1">{item.totalOS} OS</Text>
            </View>
            <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 13 }}>
              R$ {item.faturamento.toFixed(2)}
            </Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
