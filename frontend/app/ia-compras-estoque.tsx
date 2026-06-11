import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function IAComprasEstoqueScreen() {
  const colors = useColors();
  const [itens] = useState<any[]>([]);

  const dashboard = {
    valorTotalEstoque: 0,
    estoqueCritico: 0,
    comprasRecomendadas: [],
  };

  const analise = {
    lucroTotal: 0,
    eficiencia: 0,
  };

  const alertas: any[] = [];

  const CartaoItem = ({ item }: any) => {
    const obterCorRotatividade = () => {
      switch (item.rotatividade) {
        case "alta":
          return colors.success;
        case "media":
          return colors.primary;
        case "baixa":
          return colors.warning;
        default:
          return colors.error;
      }
    };

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: obterCorRotatividade(),
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 14, marginBottom: 4 }}>
              {item.nome}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {item.codigoInterno} • {item.categoria}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: obterCorRotatividade() + "20",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: obterCorRotatividade(), fontWeight: "bold", fontSize: 11 }}>
              {item.rotatividade?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Estoque: {item.quantidade}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Mínimo: {item.quantidadeMinima}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Crítico: {item.quantidadeCritica}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Preço: R$ {item.preco}</Text>
            <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 12 }}>Lucro: R$ {item.lucroTotal}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          IA de Compras e Estoque
        </Text>

        {/* Resumo */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.primary + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Valor Total</Text>
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 16 }}>
                R$ {dashboard.valorTotalEstoque.toLocaleString("pt-BR")}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.success + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Lucro Total</Text>
              <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 16 }}>
                R$ {analise.lucroTotal.toLocaleString("pt-BR")}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.error + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Crítico</Text>
              <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 16 }}>
                {dashboard.estoqueCritico}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.warning + "15", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>Eficiência</Text>
              <Text style={{ color: colors.warning, fontWeight: "bold", fontSize: 16 }}>
                {Math.round(analise.eficiencia)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Alertas */}
        {alertas.length > 0 && (
          <>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
              ALERTAS ({alertas.length})
            </Text>
            {alertas.slice(0, 3).map((alerta: any) => (
              <View
                key={alerta.id}
                style={{
                  backgroundColor: alerta.severidade === "critico" ? colors.error + "15" : colors.warning + "15",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="warning" size={18} color={alerta.severidade === "critico" ? colors.error : colors.warning} />
                <Text style={{ color: alerta.severidade === "critico" ? colors.error : colors.warning, fontWeight: "bold", fontSize: 12, flex: 1 }}>
                  {alerta.mensagem}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Itens de Estoque */}
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12, marginTop: 16 }}>
          ITENS DE ESTOQUE ({itens.length})
        </Text>

        {itens.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <MaterialIcons name="inventory-2" size={32} color={colors.muted} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, textAlign: "center" }}>
              Nenhum item no estoque
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 4 }}>
              Comece adicionando produtos ao seu estoque
            </Text>
          </View>
        ) : (
          itens.map((item) => (
            <CartaoItem key={item.id} item={item} />
          ))
        )}

        {/* Compras Recomendadas */}
        {dashboard.comprasRecomendadas.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              Compras Recomendadas
            </Text>
            {dashboard.comprasRecomendadas.map((compra: any) => (
              <View
                key={compra.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>
                  {compra.sugestao}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  Quantidade: {compra.quantidadeRecomendada} | Prioridade: {compra.prioridade}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
