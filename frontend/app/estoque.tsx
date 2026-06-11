import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getProdutos } from "@/lib/estoque-store";
import { Produto } from "@/lib/estoque-types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function EstoqueScreen() {
  const router = useRouter();
  const colors = useColors();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setLoading(true);
    const lista = await getProdutos();
    setProdutos(lista);
    setLoading(false);
  };

  const produtosFiltrados = filtroCategoria
    ? produtos.filter((p) => p.categoria === filtroCategoria)
    : produtos;

  const categorias = Array.from(new Set(produtos.map((p) => p.categoria)));

  const renderProduto = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      onPress={() => router.push(`/estoque/produto/${item.id}`)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor:
          item.quantidade < item.estoque_minimo
            ? colors.error
            : colors.primary,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            {item.nome}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
            Código: {item.codigo}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Qtd: {item.quantidade} un
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Mín: {item.estoque_minimo}
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
            R$ {item.preco_venda.toFixed(2)}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
          Estoque
        </Text>

        {/* Filtro por Categoria */}
        {categorias.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            <TouchableOpacity
              onPress={() => setFiltroCategoria("")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor:
                  filtroCategoria === ""
                    ? colors.primary
                    : colors.surface,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color:
                    filtroCategoria === ""
                      ? "#fff"
                      : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setFiltroCategoria(cat)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor:
                    filtroCategoria === cat
                      ? colors.primary
                      : colors.surface,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color:
                      filtroCategoria === cat
                        ? "#fff"
                        : colors.foreground,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Info Cards */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              borderLeftWidth: 3,
              borderLeftColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
              Total de Produtos
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {produtos.length}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              borderLeftWidth: 3,
              borderLeftColor: colors.error,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
              Baixo Estoque
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.error }}>
              {produtos.filter((p) => p.quantidade < p.estoque_minimo).length}
            </Text>
          </View>
        </View>
      </View>

      {/* Botão Novo Produto */}
      <TouchableOpacity
        onPress={() => router.push("/estoque/novo")}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 12,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
          Novo Produto
        </Text>
      </TouchableOpacity>

      {/* Lista de Produtos */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Carregando...</Text>
        </View>
      ) : produtosFiltrados.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <MaterialIcons name="inbox" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            {filtroCategoria
              ? "Nenhum produto nesta categoria"
              : "Nenhum produto cadastrado"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={produtosFiltrados}
          renderItem={renderProduto}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </ScreenContainer>
  );
}
