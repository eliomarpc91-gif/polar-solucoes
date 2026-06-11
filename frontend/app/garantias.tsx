import { useState, useCallback } from "react";
import { FlatList, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, OrdemServico } from "@/lib/store";

export default function GarantiasScreen() {
  const colors = useColors();
  const router = useRouter();
  const [osConcluidas, setOsConcluidas] = useState<OrdemServico[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    setOsConcluidas(
      ordens
        .filter((o) => o.status === "concluido")
        .sort((a, b) => (b.concluidoEm || b.atualizadoEm).localeCompare(a.concluidoEm || a.atualizadoEm))
    );
  };

  const isInWarranty = (os: OrdemServico) => {
    const concluded = new Date(os.concluidoEm || os.atualizadoEm);
    const now = new Date();
    const diffDays = (now.getTime() - concluded.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90; // 90 days warranty
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Garantias</Text>
      </View>

      <FlatList
        data={osConcluidas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <MaterialIcons name="verified" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3">Nenhuma OS concluída</Text>
          </View>
        }
        renderItem={({ item }) => {
          const inWarranty = isInWarranty(item);
          return (
            <Pressable
              onPress={() => router.push(`/os/${item.id}` as any)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.border : colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground font-semibold">OS #{item.numero}</Text>
                  <Text className="text-muted text-sm mt-1">{item.clienteNome}</Text>
                </View>
                <View
                  style={{
                    backgroundColor: (inWarranty ? colors.success : colors.muted) + "20",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: inWarranty ? colors.success : colors.muted, fontSize: 11, fontWeight: "600" }}>
                    {inWarranty ? "Em garantia" : "Expirada"}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}
