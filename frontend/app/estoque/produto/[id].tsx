import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getProdutoById,
  deleteProduto,
  getMovimentacoesPorProduto,
} from "@/lib/estoque-store";
import { Produto } from "@/lib/estoque-types";
import { MovimentacaoEstoque } from "@/lib/estoque-types";

export default function ProdutoDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const p = await getProdutoById(id!);
    setProduto(p);

    if (p) {
      const m = await getMovimentacoesPorProduto(p.id);
      setMovimentacoes(m.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Produto",
      `Tem certeza que deseja excluir "${produto?.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (produto) {
              await deleteProduto(produto.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!produto) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const lucroUnitario = produto.preco_venda - produto.custo_real;
  const lucroTotal = lucroUnitario * produto.quantidade;

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-4">Produto</Text>
        </View>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons name="delete" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Nome e Código */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="inventory-2" size={36} color={colors.primary} />
          </View>
          <Text className="text-foreground text-xl font-bold mt-3">
            {produto.nome}
          </Text>
          <Text className="text-muted text-sm mt-1">Código: {produto.codigo}</Text>
        </View>

        {/* Status de Estoque */}
        <View
          className="bg-surface rounded-xl p-4 border border-border mb-4"
        >
          <Text className="text-muted text-xs font-semibold mb-3">
            ESTOQUE
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View>
              <Text className="text-muted text-xs">Quantidade</Text>
              <Text className="text-foreground font-bold text-lg mt-1">
                {produto.quantidade} un
              </Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Estoque Mínimo</Text>
              <Text className="text-foreground font-bold text-lg mt-1">
                {produto.estoque_minimo} un
              </Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Status</Text>
              <View
                style={{
                  backgroundColor:
                    produto.quantidade <= produto.estoque_minimo
                      ? colors.error + "20"
                      : colors.success + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color:
                      produto.quantidade <= produto.estoque_minimo
                        ? colors.error
                        : colors.success,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {produto.quantidade <= produto.estoque_minimo
                    ? "Baixo"
                    : "OK"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informações Básicas */}
        <View
          className="bg-surface rounded-xl p-4 border border-border mb-4"
        >
          <Text className="text-muted text-xs font-semibold mb-3">
            INFORMAÇÕES
          </Text>
          <View style={{ marginBottom: 10 }}>
            <Text className="text-muted text-xs">Categoria</Text>
            <Text className="text-foreground text-sm mt-1">
              {produto.categoria}
            </Text>
          </View>
          <View style={{ marginBottom: 10 }}>
            <Text className="text-muted text-xs">Fornecedor</Text>
            <Text className="text-foreground text-sm mt-1">
              {produto.fornecedor || "Não informado"}
            </Text>
          </View>
          {produto.observacoes && (
            <View>
              <Text className="text-muted text-xs">Observações</Text>
              <Text className="text-foreground text-sm mt-1">
                {produto.observacoes}
              </Text>
            </View>
          )}
        </View>

        {/* Custos e Preços */}
        <View
          className="bg-surface rounded-xl p-4 border border-border mb-4"
        >
          <Text className="text-muted text-xs font-semibold mb-3">
            CUSTOS E PREÇOS
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View>
              <Text className="text-muted text-xs">Preço de Compra</Text>
              <Text className="text-foreground font-semibold mt-1">
                R$ {produto.preco_compra.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Frete</Text>
              <Text className="text-foreground font-semibold mt-1">
                R$ {produto.frete.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Impostos</Text>
              <Text className="text-foreground font-semibold mt-1">
                R$ {produto.impostos.toFixed(2)}
              </Text>
            </View>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <View>
                <Text className="text-muted text-xs">Custo Real</Text>
                <Text className="text-foreground font-bold text-base mt-1">
                  R$ {produto.custo_real.toFixed(2)}
                </Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Lucro %</Text>
                <Text className="text-foreground font-bold text-base mt-1">
                  {produto.lucro_percentual.toFixed(1)}%
                </Text>
              </View>
              <View>
                <Text className="text-muted text-xs">Preço de Venda</Text>
                <Text className="text-foreground font-bold text-base mt-1">
                  R$ {produto.preco_venda.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lucro */}
        <View
          className="bg-success/10 rounded-xl p-4 border border-success/30 mb-4"
        >
          <Text className="text-muted text-xs font-semibold mb-3">
            LUCRO
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View>
              <Text className="text-muted text-xs">Lucro Unitário</Text>
              <Text className="text-success font-bold text-base mt-1">
                R$ {lucroUnitario.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Lucro Total</Text>
              <Text className="text-success font-bold text-base mt-1">
                R$ {lucroTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Histórico de Movimentações */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-muted text-xs font-semibold mb-3">
            HISTÓRICO ({movimentacoes.length})
          </Text>
          {movimentacoes.length === 0 ? (
            <Text className="text-muted text-sm text-center py-4">
              Nenhuma movimentação registrada
            </Text>
          ) : (
            movimentacoes.map((mov) => (
              <View
                key={mov.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-foreground text-sm font-medium">
                    {mov.tipo === "entrada" ? "Entrada" : "Saída"} -{" "}
                    {mov.quantidade} un
                  </Text>
                  <Text className="text-muted text-xs mt-1">{mov.motivo}</Text>
                </View>
                <Text className="text-muted text-xs">
                  {new Date(mov.criadoEm).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
