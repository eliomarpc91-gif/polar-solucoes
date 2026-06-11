import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useCallback } from "react";
import { getCentroDeCustos, adicionarImposto, removerImposto } from "@/lib/hh-store";
import { Imposto } from "@/lib/hh-types";

const TIPOS = [
  { label: "Simples Nacional", value: "simples_nacional" },
  { label: "Imposto sobre Serviço", value: "imposto_servico" },
  { label: "Imposto sobre Peças", value: "imposto_pecas" },
  { label: "Taxas Adicionais", value: "taxas_adicionais" },
];

export default function ImpostosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [impostos, setImpostos] = useState<Imposto[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [tipo, setTipo] = useState("simples_nacional");
  const [descricao, setDescricao] = useState("");
  const [percentual, setPercentual] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useFocusEffect(
    useCallback(() => {
      carregarImpostos();
    }, [])
  );

  const carregarImpostos = async () => {
    const centro = await getCentroDeCustos();
    if (centro) {
      setImpostos(centro.impostos);
    }
  };

  const salvarImposto = async () => {
    if (!descricao.trim() || !percentual.trim()) {
      Alert.alert("Erro", "Preencha descrição e percentual!");
      return;
    }

    const novoImposto = await adicionarImposto({
      tipo: tipo as any,
      descricao,
      percentual: parseFloat(percentual),
      observacoes: observacoes || undefined,
    });

    setImpostos([...impostos, novoImposto]);
    setDescricao("");
    setPercentual("");
    setObservacoes("");
    setAdicionando(false);
    Alert.alert("Sucesso", "Imposto adicionado!");
  };

  const deletarImposto = async (id: string) => {
    Alert.alert("Confirmar", "Deseja remover este imposto?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Remover",
        onPress: async () => {
          await removerImposto(id);
          setImpostos(impostos.filter((i) => i.id !== id));
          Alert.alert("Sucesso", "Imposto removido!");
        },
      },
    ]);
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
    marginBottom: 12,
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-2xl font-bold">Impostos</Text>
          <Pressable
            onPress={() => setAdicionando(!adicionando)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name={adicionando ? "close" : "add-circle"} size={28} color={colors.primary} />
          </Pressable>
        </View>

        {adicionando && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-foreground font-bold mb-4">Novo Imposto</Text>

            <Text className="text-muted text-xs font-semibold mb-2">Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {TIPOS.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setTipo(t.value)}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: tipo === t.value ? colors.primary : colors.border,
                      marginRight: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: tipo === t.value ? colors.background : colors.foreground, fontSize: 12, fontWeight: "500" }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="text-muted text-xs font-semibold mb-2">Descrição</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Ex: ISS - Imposto sobre Serviço"
              style={inputStyle}
            />

            <Text className="text-muted text-xs font-semibold mb-2">Percentual (%)</Text>
            <TextInput
              value={percentual}
              onChangeText={setPercentual}
              placeholder="Ex: 5.00"
              keyboardType="decimal-pad"
              style={inputStyle}
            />

            <Text className="text-muted text-xs font-semibold mb-2">Observações</Text>
            <TextInput
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Opcional"
              style={inputStyle}
              multiline
            />

            <Pressable
              onPress={salvarImposto}
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
              <Text style={{ color: colors.background, fontWeight: "600" }}>Adicionar Imposto</Text>
            </Pressable>
          </View>
        )}

        {impostos.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <MaterialIcons name="inbox" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3">Nenhum imposto cadastrado</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            {impostos.map((imposto, index) => (
              <View
                key={imposto.id}
                style={{
                  padding: 16,
                  borderBottomWidth: index < impostos.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground font-semibold text-sm">{imposto.descricao}</Text>
                  <Text className="text-muted text-xs mt-1">
                    {TIPOS.find((t) => t.value === imposto.tipo)?.label}
                  </Text>
                  {imposto.observacoes && <Text className="text-muted text-xs mt-1 italic">{imposto.observacoes}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                  <Text className="text-foreground font-bold">{imposto.percentual.toFixed(2)}%</Text>
                  <Pressable
                    onPress={() => deletarImposto(imposto.id)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 8 }]}
                  >
                    <MaterialIcons name="delete" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {impostos.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text className="text-muted text-sm">Total de Impostos:</Text>
              <Text className="text-foreground font-bold text-lg">
                {impostos.reduce((sum, i) => sum + i.percentual, 0).toFixed(2)}%
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
