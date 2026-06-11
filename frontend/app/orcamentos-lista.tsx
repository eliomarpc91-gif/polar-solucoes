import React, { useState, useCallback } from "react";
import { FlatList, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrcamentos, Orcamento, saveCobranca } from "@/lib/store";
import { Alert } from "react-native";

export default function OrcamentosListaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "enviado" | "aprovado" | "rejeitado">("todos");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getOrcamentos();
    setOrcamentos(data.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)));
  };

  const filtered = orcamentos.filter((o) => {
    const matchBusca = busca === "" || o.clienteNome.toLowerCase().includes(busca.toLowerCase()) || o.numero.toString().includes(busca);
    const matchFiltro = filtro === "todos" || o.status === filtro;
    return matchBusca && matchFiltro;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "enviado": return colors.warning;
      case "aprovado": return colors.success;
      case "rejeitado": return colors.error;
      default: return colors.muted;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "enviado": return "ENVIADO";
      case "aprovado": return "APROVADO";
      case "rejeitado": return "REJEITADO";
      default: return status.toUpperCase();
    }
  };

  const aprovarECriarCobranca = async (orcamento: Orcamento) => {
    Alert.alert(
      "Aprovar Orçamento",
      "Deseja aprovar este orçamento e criar uma cobrança automaticamente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: async () => {
            try {
              const novaCobranca = {
                clienteId: orcamento.clienteId,
                clienteNome: orcamento.clienteNome,
                descricao: `Cobrança do Orçamento #${orcamento.numero}`,
                valorTotal: orcamento.valorTotal,
                valorPendente: orcamento.valorTotal,
                valorRecebido: 0,
                status: "pendente",
                dataCriacao: new Date().toISOString().split("T")[0],
                dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                dataPagamento: undefined,
                formaPagamento: "",
                orcamentoId: orcamento.id,
              };
              await saveCobranca(novaCobranca);
              Alert.alert("Sucesso", "Orçamento aprovado e cobrança criada!");
              loadData();
            } catch (error) {
              const msg = error instanceof Error ? error.message : String(error);
              Alert.alert("Erro", msg);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text className="text-2xl font-bold text-foreground">Orçamentos</Text>
        <Pressable onPress={() => router.push("/orcamento/novo" as any)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <View style={{ backgroundColor: colors.primary, borderRadius: 50, padding: 12 }}>
            <MaterialIcons name="add" size={24} color="white" />
          </View>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <TextInput
          placeholder="Buscar por cliente ou número..."
          placeholderTextColor={colors.muted}
          value={busca}
          onChangeText={setBusca}
          style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, borderWidth: 1, borderColor: colors.border }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        {(["todos", "enviado", "aprovado", "rejeitado"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFiltro(f)}
            style={({ pressed }) => [
              {
                backgroundColor: filtro === f ? colors.primary : colors.surface,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                opacity: pressed ? 0.7 : 1,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: filtro === f ? "#FFF" : colors.foreground, fontSize: 11, fontWeight: "600" }}>
              {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <MaterialIcons name="description" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3">Nenhum orçamento encontrado</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Pressable
              onPress={() => router.push(`/orcamento/${item.id}` as any)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.border : colors.surface,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text className="text-foreground font-bold text-sm">Orçamento #{item.numero}</Text>
                  <View style={{ backgroundColor: statusColor(item.status) + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginLeft: 8 }}>
                    <Text style={{ color: statusColor(item.status), fontSize: 9, fontWeight: "700" }}>{statusLabel(item.status)}</Text>
                  </View>
                </View>
                <Text className="text-muted text-xs mt-1">{item.clienteNome}</Text>
              </View>
              <Text style={{ color: colors.success, fontWeight: "700", fontSize: 14 }}>
                R$ {item.valorTotal.toFixed(2)}
              </Text>
            </Pressable>
            {item.status === "enviado" && (
              <Pressable
                onPress={() => aprovarECriarCobranca(item)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.success,
                    borderRadius: 10,
                    padding: 10,
                    marginTop: 8,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold text-sm">
                  ✓ Aprovar e Criar Cobrança
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </ScreenContainer>
  );
}
