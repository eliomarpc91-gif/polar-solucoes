import { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { OrcamentoForm } from "@/components/orcamento-form";
import {
  getOrcamentos,
  updateOrcamento,
  Orcamento,
} from "@/lib/store";

export default function EditarOrcamentoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrcamento();
  }, [id]);

  const loadOrcamento = async () => {
    try {
      const orcamentos = await getOrcamentos();
      const found = orcamentos.find((o) => o.id === id);
      if (found) {
        setOrcamento(found);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (orcamentoAtualizado: Orcamento) => {
    await updateOrcamento(orcamentoAtualizado);
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orcamento) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Orçamento não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Editar Orçamento #{orcamento.numero}</Text>
      </View>

      <OrcamentoForm
        orcamentoInicial={orcamento}
        onSave={handleSave}
        onCancel={handleCancel}
        titulo={`Editar Orçamento #${orcamento.numero}`}
        numero={orcamento.numero}
      />
    </SafeAreaView>
  );
}
