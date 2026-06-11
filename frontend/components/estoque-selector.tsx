import { ScrollView, Text, View, TextInput, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Produto } from "@/lib/estoque-types";
import { useColors } from "@/hooks/use-colors";

interface EstoqueSelectorProps {
  produtos: Produto[];
  searchProduto: string;
  setSearchProduto: (text: string) => void;
  quantidadeProduto: string;
  setQuantidadeProduto: (text: string) => void;
  onSelectProduto: (produto: Produto) => void;
  onClose: () => void;
  inputStyle: any;
}

export function EstoqueSelector({
  produtos,
  searchProduto,
  setSearchProduto,
  quantidadeProduto,
  setQuantidadeProduto,
  onSelectProduto,
  onClose,
  inputStyle,
}: EstoqueSelectorProps) {
  const colors = useColors();

  const filteredProdutos = produtos.filter(
    (p) =>
      searchProduto === "" ||
      p.nome.toLowerCase().includes(searchProduto.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchProduto.toLowerCase())
  );

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
        <TextInput
          value={searchProduto}
          onChangeText={setSearchProduto}
          placeholder="Buscar produto..."
          placeholderTextColor={colors.muted}
          style={{ ...inputStyle, flex: 1 }}
        />
        <TextInput
          value={quantidadeProduto}
          onChangeText={setQuantidadeProduto}
          placeholder="Qtd"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
          style={{ ...inputStyle, width: 50 }}
        />
      </View>
      <ScrollView style={{ maxHeight: 200 }}>
        {filteredProdutos.length === 0 ? (
          <Text className="text-muted text-xs text-center py-4">
            Nenhum produto encontrado
          </Text>
        ) : (
          filteredProdutos.map((prod) => (
            <Pressable
              key={prod.id}
              onPress={() => onSelectProduto(prod)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.border : colors.background,
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground text-sm font-medium">
                    {prod.nome}
                  </Text>
                  <Text className="text-muted text-xs mt-1">
                    Código: {prod.codigo}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text className="text-foreground font-semibold text-sm">
                    R$ {prod.preco_venda.toFixed(2)}
                  </Text>
                  <Text
                    style={{
                      color:
                        prod.quantidade <= prod.estoque_minimo
                          ? colors.error
                          : colors.success,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {prod.quantidade} un
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          {
            backgroundColor: colors.border,
            padding: 8,
            borderRadius: 6,
            marginTop: 8,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: colors.foreground,
            fontSize: 12,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          Fechar
        </Text>
      </Pressable>
    </View>
  );
}
