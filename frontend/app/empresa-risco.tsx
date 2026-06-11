import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { analisarEmpresaEmRisco } from "@/lib/financeiro-store";
import type { EmpresaEmRisco } from "@/lib/financeiro-types";

export default function EmpresaRiscoScreen() {
  const colors = useColors();
  const [analise, setAnalise] = useState<EmpresaEmRisco | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarAnalise();
    }, [])
  );

  const carregarAnalise = async () => {
    setCarregando(true);
    try {
      const dados = await analisarEmpresaEmRisco();
      setAnalise(dados);
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
    } finally {
      setCarregando(false);
    }
  };

  const aoAtualizar = async () => {
    setAtualizando(true);
    try {
      const dados = await analisarEmpresaEmRisco();
      setAnalise(dados);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    } finally {
      setAtualizando(false);
    }
  };

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case "baixo":
        return colors.success;
      case "moderado":
        return colors.warning;
      case "alto":
        return "#FF6B6B";
      case "critico":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getRiscoIcon = (risco: string) => {
    switch (risco) {
      case "baixo":
        return "check-circle";
      case "moderado":
        return "info";
      case "alto":
        return "warning";
      case "critico":
        return "error";
      default:
        return "help";
    }
  };

  if (carregando) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!analise) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Análise de Risco
        </Text>
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
          <MaterialIcons name="error-outline" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
            Erro ao carregar análise
          </Text>
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
          Análise de Risco
        </Text>

        {/* Card de Risco Principal */}
        <View
          style={{
            backgroundColor: getRiscoColor(analise.risco) + "20",
            borderLeftWidth: 4,
            borderLeftColor: getRiscoColor(analise.risco),
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <MaterialIcons name={getRiscoIcon(analise.risco) as any} size={32} color={getRiscoColor(analise.risco)} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
                NÍVEL DE RISCO
              </Text>
              <Text
                style={{
                  color: getRiscoColor(analise.risco),
                  fontSize: 20,
                  fontWeight: "bold",
                  textTransform: "capitalize",
                }}
              >
                {analise.risco === "critico"
                  ? "🚨 Crítico"
                  : analise.risco === "alto"
                  ? "⚠️ Alto"
                  : analise.risco === "moderado"
                  ? "⚡ Moderado"
                  : "✅ Baixo"}
              </Text>
            </View>
          </View>
        </View>

        {/* Indicadores */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
            INDICADORES DETECTADOS
          </Text>
          <View style={{ gap: 8 }}>
            {Object.entries(analise.indicadores).map(([key, value]) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <MaterialIcons
                  name={value ? "check-circle" : "cancel"}
                  size={20}
                  color={value ? colors.error : colors.success}
                />
                <Text style={{ color: colors.foreground, fontSize: 12, flex: 1, textTransform: "capitalize" }}>
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </Text>
                <Text style={{ color: value ? colors.error : colors.success, fontWeight: "bold", fontSize: 12 }}>
                  {value ? "SIM" : "NÃO"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ações Recomendadas */}
        {analise.acoes.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              AÇÕES RECOMENDADAS
            </Text>
            {analise.acoes.map((acao, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: acao.prioridade === "alta" ? colors.error + "10" : colors.warning + "10",
                  borderLeftWidth: 3,
                  borderLeftColor: acao.prioridade === "alta" ? colors.error : colors.warning,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "bold", flex: 1 }}>
                    {acao.acao}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary + "20",
                      borderRadius: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 11 }}>
                      +{acao.impacto}%
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.muted, fontSize: 11, textTransform: "capitalize" }}>
                  Prioridade: {acao.prioridade}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Sugestões */}
        {analise.sugestoes.length > 0 && (
          <View
            style={{
              backgroundColor: colors.primary + "20",
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontWeight: "bold", flex: 1 }}>
                Sugestões Gerais
              </Text>
            </View>
            {analise.sugestoes.map((sugestao, idx) => (
              <Text key={idx} style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                • {sugestao}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
