import { ScrollView, Text, View, Pressable, TextInput, Alert, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useCallback } from "react";
import { getCentroDeCustos, adicionarCustoFixo, removerCustoFixo } from "@/lib/hh-store";
import { CustoFixo } from "@/lib/hh-types";

const CATEGORIAS = [
  { label: "Aluguel", value: "aluguel" },
  { label: "Água", value: "agua" },
  { label: "Energia", value: "energia" },
  { label: "Internet", value: "internet" },
  { label: "Aplicativos", value: "aplicativos" },
  { label: "Contador", value: "contador" },
  { label: "Funcionários", value: "funcionarios" },
  { label: "Pró-labore", value: "pro_labore" },
  { label: "Marketing", value: "marketing" },
  { label: "Ferramentas", value: "ferramentas" },
  { label: "Seguro", value: "seguro" },
  { label: "Veículo", value: "veiculo" },
  { label: "Outros", value: "outros" },
];

export default function CustoFixoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [categoria, setCategoria] = useState("aluguel");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useFocusEffect(
    useCallback(() => {
      carregarCustos();
    }, [])
  );

  const carregarCustos = async () => {
    const centro = await getCentroDeCustos();
    if (centro) {
      setCustos(centro.custos_fixos);
    }
  };

  const salvarCusto = async () => {
    if (!descricao.trim() || !valor.trim()) {
      Alert.alert("Erro", "Preencha descrição e valor!");
      return;
    }

    const novoCusto = await adicionarCustoFixo({
      categoria: categoria as any,
      descricao,
      valor: parseFloat(valor),
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      observacoes: observacoes || undefined,
    });

    setCustos([...custos, novoCusto]);
    setDescricao("");
    setValor("");
    setObservacoes("");
    setAdicionando(false);
    Alert.alert("Sucesso", "Custo fixo adicionado!");
  };

  const deletarCusto = async (id: string) => {
    Alert.alert("Confirmar", "Deseja remover este custo?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Remover",
        onPress: async () => {
          await removerCustoFixo(id);
          setCustos(custos.filter((c) => c.id !== id));
          Alert.alert("Sucesso", "Custo removido!");
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
          <Text className="text-foreground text-2xl font-bold">Custos Fixos</Text>
          <Pressable
            onPress={() => setAdicionando(!adicionando)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name={adicionando ? "close" : "add-circle"} size={28} color={colors.primary} />
          </Pressable>
        </View>

        {adicionando && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-foreground font-bold mb-4">Novo Custo Fixo</Text>

            <Text className="text-muted text-xs font-semibold mb-2">Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIAS.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategoria(cat.value)}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: categoria === cat.value ? colors.primary : colors.border,
                      marginRight: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: categoria === cat.value ? colors.background : colors.foreground, fontSize: 12, fontWeight: "500" }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="text-muted text-xs font-semibold mb-2">Descrição</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Ex: Aluguel do escritório"
              style={inputStyle}
            />

            <Text className="text-muted text-xs font-semibold mb-2">Valor (R$)</Text>
            <TextInput
              value={valor}
              onChangeText={setValor}
              placeholder="Ex: 2000.00"
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
              onPress={salvarCusto}
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
              <Text style={{ color: colors.background, fontWeight: "600" }}>Adicionar Custo</Text>
            </Pressable>
          </View>
        )}

        {custos.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <MaterialIcons name="inbox" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3">Nenhum custo fixo cadastrado</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            {custos.map((custo, index) => (
              <View
                key={custo.id}
                style={{
                  padding: 16,
                  borderBottomWidth: index < custos.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground font-semibold text-sm">{custo.descricao}</Text>
                  <Text className="text-muted text-xs mt-1">
                    {CATEGORIAS.find((c) => c.value === custo.categoria)?.label}
                  </Text>
                  {custo.observacoes && <Text className="text-muted text-xs mt-1 italic">{custo.observacoes}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                  <Text className="text-foreground font-bold">R$ {custo.valor.toFixed(2)}</Text>
                  <Pressable
                    onPress={() => deletarCusto(custo.id)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 8 }]}
                  >
                    <MaterialIcons name="delete" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {custos.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text className="text-muted text-sm">Total Mensal:</Text>
              <Text className="text-foreground font-bold text-lg">
                R$ {custos.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
