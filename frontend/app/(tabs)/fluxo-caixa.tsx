import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatorioFluxoCaixa } from "@/components/relatorio-fluxo-caixa";
import { getCobrancas } from "@/lib/store";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function FluxoCaixaScreen() {
  const colors = useColors();
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30);
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCobrancas();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Recarregar quando a tela ganhar foco
      loadCobrancas();
      return () => {};
    }, [])
  );

  const loadCobrancas = async () => {
    try {
      setLoading(true);
      const data = await getCobrancas() || [];
      setCobrancas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar cobranças:", error);
      setCobrancas([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Fluxo de Caixa
          </Text>
          <Text className="text-base text-muted">
            Acompanhe suas entradas e saídas
          </Text>
        </View>

        {/* Filtro de Período */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-3">
            PERÍODO
          </Text>
          <View className="flex-row gap-2">
            {[
              { label: "7 dias", value: 7 },
              { label: "30 dias", value: 30 },
              { label: "90 dias", value: 90 },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setPeriodo(item.value as 7 | 30 | 90)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor:
                    periodo === item.value ? colors.primary : colors.border,
                  backgroundColor:
                    periodo === item.value ? colors.surface : colors.background,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: periodo === item.value ? "600" : "400",
                    color:
                      periodo === item.value ? colors.primary : colors.foreground,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Relatório */}
        {loading ? (
          <View className="items-center justify-center py-12">
            <MaterialIcons name="hourglass-empty" size={32} color={colors.muted} />
            <Text className="text-muted mt-2">Carregando dados...</Text>
          </View>
        ) : (
          <RelatorioFluxoCaixa cobrancas={cobrancas} periodo={periodo} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
