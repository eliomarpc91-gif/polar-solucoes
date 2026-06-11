import { useState } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveProduto } from "@/lib/estoque-store";
import { calcularCustoReal, calcularPrecoVenda } from "@/lib/estoque-store";
import { Produto } from "@/lib/estoque-types";

// InputField DEFINIDO FORA - corrige bug de teclado fechando a cada letra
type EstoqueFieldProps = {
  colors: any;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words";
};
function InputField({ colors, label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: EstoqueFieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="text-muted text-xs font-semibold mb-2 ml-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 14,
          color: colors.foreground,
          fontSize: 14,
        }}
      />
    </View>
  );
}

export default function NovoProdutoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [codigo, setCodigo] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState("0");
  const [estoque_minimo, setEstoque_minimo] = useState("10");
  const [preco_compra, setPreco_compra] = useState("0");
  const [frete, setFrete] = useState("0");
  const [impostos, setImpostos] = useState("0");
  const [lucro_percentual, setLucro_percentual] = useState("30");
  const [observacoes, setObservacoes] = useState("");

  const calcularValores = () => {
    const pc = parseFloat(preco_compra) || 0;
    const fr = parseFloat(frete) || 0;
    const imp = parseFloat(impostos) || 0;
    const lp = parseFloat(lucro_percentual) || 0;

    const custoReal = calcularCustoReal(pc, fr, imp);
    const precoVenda = calcularPrecoVenda(custoReal, lp);

    return { custoReal, precoVenda };
  };

  const { custoReal, precoVenda } = calcularValores();

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Preencha o nome do produto");
      return;
    }

    if (!categoria.trim()) {
      Alert.alert("Erro", "Preencha a categoria");
      return;
    }

    const produto: Produto = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      nome: nome.trim(),
      categoria: categoria.trim(),
      codigo: codigo.trim(),
      fornecedor: fornecedor.trim(),
      quantidade: parseInt(quantidade) || 0,
      estoque_minimo: parseInt(estoque_minimo) || 10,
      preco_compra: parseFloat(preco_compra) || 0,
      frete: parseFloat(frete) || 0,
      impostos: parseFloat(impostos) || 0,
      lucro_percentual: parseFloat(lucro_percentual) || 30,
      custo_real: custoReal,
      preco_venda: precoVenda,
      observacoes: observacoes.trim(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    await saveProduto(produto);
    Alert.alert("Sucesso", "Produto cadastrado com sucesso!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  // InputField definido fora do componente para evitar perda de foco

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">
          Novo Produto
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Informações Básicas */}
        <Text className="text-muted text-xs font-semibold mb-3 ml-1">
          INFORMAÇÕES BÁSICAS
        </Text>
        <InputField colors={colors}
          label="Nome do Produto *"
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Compressor 2HP"
          autoCapitalize="words"
        />
        <InputField colors={colors}
          label="Categoria *"
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Ex: Compressores"
          autoCapitalize="words"
        />
        <InputField colors={colors}
          label="Código Interno"
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Ex: COMP-001"
          autoCapitalize="none"
        />
        <InputField colors={colors}
          label="Fornecedor"
          value={fornecedor}
          onChangeText={setFornecedor}
          placeholder="Ex: Electrolux"
          autoCapitalize="words"
        />

        {/* Estoque */}
        <Text className="text-muted text-xs font-semibold mb-3 ml-1 mt-4">
          ESTOQUE
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <InputField colors={colors}
              label="Quantidade"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <InputField colors={colors}
              label="Estoque Mínimo"
              value={estoque_minimo}
              onChangeText={setEstoque_minimo}
              placeholder="10"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Custos */}
        <Text className="text-muted text-xs font-semibold mb-3 ml-1 mt-4">
          CUSTOS
        </Text>
        <InputField colors={colors}
          label="Preço de Compra (R$)"
          value={preco_compra}
          onChangeText={setPreco_compra}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <InputField colors={colors}
          label="Frete (R$)"
          value={frete}
          onChangeText={setFrete}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <InputField colors={colors}
          label="Impostos (R$)"
          value={impostos}
          onChangeText={setImpostos}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        {/* Lucro */}
        <Text className="text-muted text-xs font-semibold mb-3 ml-1 mt-4">
          LUCRO
        </Text>
        <InputField colors={colors}
          label="Percentual de Lucro (%)"
          value={lucro_percentual}
          onChangeText={setLucro_percentual}
          placeholder="30"
          keyboardType="decimal-pad"
        />

        {/* Resumo de Cálculos */}
        <View
          className="bg-surface rounded-xl p-4 border border-border mt-6 mb-6"
        >
          <Text className="text-muted text-xs font-semibold mb-3">
            RESUMO DE CÁLCULOS
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text className="text-muted text-sm">Custo Real:</Text>
            <Text className="text-foreground font-semibold">
              R$ {custoReal.toFixed(2)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text className="text-muted text-sm">Preço de Venda:</Text>
            <Text className="text-foreground font-semibold text-lg">
              R$ {precoVenda.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Observações */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">
          OBSERVAÇÕES
        </Text>
        <TextInput
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Observações sobre o produto..."
          placeholderTextColor={colors.muted}
          multiline
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 14,
            color: colors.foreground,
            fontSize: 14,
            minHeight: 80,
            textAlignVertical: "top",
          }}
        />

        {/* Save Button */}
        <Pressable
          onPress={salvar}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 24,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>
            Salvar Produto
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
