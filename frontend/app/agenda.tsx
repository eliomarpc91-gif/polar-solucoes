import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, OrdemServico } from "@/lib/store";

export default function AgendaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [osSemana, setOsSemana] = useState<{ [key: string]: OrdemServico[] }>({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    const abertas = ordens.filter((o) => o.status !== "concluido");

    // Group by date
    const grouped: { [key: string]: OrdemServico[] } = {};
    const hoje = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      grouped[key] = abertas.filter((o) => o.criadoEm.startsWith(key));
    }
    setOsSemana(grouped);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const hoje = new Date().toISOString().split("T")[0];
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split("T")[0];

    if (dateStr === hoje) return "Hoje";
    if (dateStr === amanhaStr) return "Amanhã";

    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Agenda</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {Object.entries(osSemana).map(([date, items]) => (
          <View key={date} style={{ marginBottom: 20 }}>
            <Text className="text-foreground text-base font-semibold mb-2 capitalize">
              {formatDate(date)}
            </Text>
            {items.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text className="text-muted text-sm">Nenhum serviço agendado</Text>
              </View>
            ) : (
              items.map((os) => (
                <Pressable
                  key={os.id}
                  onPress={() => router.push(`/os/${os.id}` as any)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: pressed ? colors.border : colors.surface,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 4,
                      height: 36,
                      borderRadius: 2,
                      backgroundColor: colors.primary,
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text className="text-foreground text-sm font-medium">OS #{os.numero}</Text>
                    <Text className="text-muted text-xs mt-1">{os.clienteNome}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
