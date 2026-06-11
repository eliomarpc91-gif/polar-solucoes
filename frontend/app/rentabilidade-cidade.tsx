import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { obterRentabilidadePorCidade, analisarRentabilidadePorCidade } from "@/lib/financeiro-store";
import type { RentabilidadePorCidade } from "@/lib/financeiro-types";

export default function RentabilidadeCidadeScreen() {
  const colors = useColors();
  const [cidades, setCidades] = useState<RentabilidadePorCidade[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    setCarregando(true);
    try {
      let dados = await obterRentabilidadePorCidade();
      if (dados.length === 0) {
        dados = await analisarRentabilidadePorCidade();
      }
      setCidades(dados.sort((a, b) => a.ranking - b.ranking));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  };

  const aoAtualizar = async () => {
    setAtualizando(true);
    try {
      const dados = await analisarRentabilidadePorCidade();
      setCidades(dados.sort((a, b) => a.ranking - b.ranking));
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    } finally {
      setAtualizando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const CartaoCidade = ({ cidade }: { cidade: RentabilidadePorCidade }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: cidade.ranking === 1 ? colors.success : colors.primary,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + "20",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            #{cidade.ranking}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 2 }}>
            {cidade.cidade}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {cidade.clientes} cliente{cidade.clientes !== 1 ? "s" : ""} • {cidade.serviços} serviço{cidade.serviços !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: colors.border + "20", borderRadius: 8, padding: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Faturamento:</Text>
          <Text style={{ color: colors.success, fontWeight: "bold" }}>
            {formatarMoeda(cidade.faturamento)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Lucro:</Text>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            {formatarMoeda(cidade.lucro)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Margem:</Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
            {cidade.margem.toFixed(1)}%
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Custo Operacional:</Text>
          <Text style={{ color: colors.warning, fontWeight: "bold" }}>
            {formatarMoeda(cidade.custoOperacional)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (carregando) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
      >
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Rentabilidade por Cidade
        </Text>

        {cidades.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <MaterialIcons name="location-city" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhuma cidade analisada
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              Realize serviços em diferentes cidades para ver análises
            </Text>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
                {cidades.length} CIDADE{cidades.length !== 1 ? "S" : ""} ANALISADA{cidades.length !== 1 ? "S" : ""}
              </Text>
            </View>
            {cidades.map((cidade) => (
              <CartaoCidade key={cidade.id} cidade={cidade} />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
