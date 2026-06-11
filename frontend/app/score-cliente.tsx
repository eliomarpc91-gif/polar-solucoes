import React, { useState, useCallback, useEffect } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { obterScoresClientes } from "@/lib/financeiro-store";
import type { ClienteScore } from "@/lib/financeiro-types";

export default function ScoreClienteScreen() {
  const colors = useColors();
  const [scores, setScores] = useState<ClienteScore[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<string | undefined>();
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarScores();
    }, [filtroNivel])
  );

  const carregarScores = async () => {
    setCarregando(true);
    try {
      const dados = await obterScoresClientes();
      const filtrados = filtroNivel ? dados.filter((s) => s.nivel === filtroNivel) : dados;
      setScores(filtrados.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error("Erro ao carregar scores:", error);
    } finally {
      setCarregando(false);
    }
  };

  const aoAtualizar = async () => {
    setAtualizando(true);
    await carregarScores();
    setAtualizando(false);
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "excelente":
        return colors.success;
      case "saudavel":
        return colors.primary;
      case "risco":
        return colors.warning;
      case "inadimplente":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case "excelente":
        return "star";
      case "saudavel":
        return "thumb-up";
      case "risco":
        return "warning";
      case "inadimplente":
        return "error";
      default:
        return "help";
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const FiltroNivel = () => (
    <View style={{ marginBottom: 16, gap: 8 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
        FILTRAR POR NÍVEL
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {["excelente", "saudavel", "risco", "inadimplente"].map((niv) => (
          <Pressable
            key={niv}
            onPress={() => setFiltroNivel(filtroNivel === niv ? undefined : niv)}
            style={({ pressed }) => [{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: filtroNivel === niv ? getNivelColor(niv) : colors.surface,
              borderWidth: 1,
              borderColor: getNivelColor(niv),
              opacity: pressed ? 0.7 : 1,
            }]}
          >
            <Text
              style={{
                color: filtroNivel === niv ? "white" : getNivelColor(niv),
                fontSize: 12,
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {niv === "saudavel" ? "Saudável" : niv === "inadimplente" ? "Inadimplente" : niv}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const CartaoScore = ({ score }: { score: ClienteScore }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: getNivelColor(score.nivel),
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Cabeçalho com Score */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: getNivelColor(score.nivel) + "20",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: getNivelColor(score.nivel), fontWeight: "bold", fontSize: 18 }}>
            {Math.round(score.score)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 4 }}>
            {score.clienteNome}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialIcons name={getNivelIcon(score.nivel) as any} size={14} color={getNivelColor(score.nivel)} />
            <Text style={{ color: getNivelColor(score.nivel), fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
              {score.nivel === "saudavel" ? "Saudável" : score.nivel === "inadimplente" ? "Inadimplente" : score.nivel}
            </Text>
          </View>
        </View>
      </View>

      {/* Métricas Principais */}
      <View style={{ backgroundColor: colors.border + "20", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Pagamentos em Dia:</Text>
          <Text style={{ color: colors.success, fontWeight: "bold" }}>
            {score.metricas.pagamentosEmDia.toFixed(0)}%
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Atrasos:</Text>
          <Text style={{ color: score.metricas.atrasos > 0 ? colors.error : colors.success, fontWeight: "bold" }}>
            {score.metricas.atrasos}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Aprovação de Orçamento:</Text>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            {score.metricas.aprovacaoOrcamento.toFixed(0)}%
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Frequência de Contratação:</Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
            {score.metricas.frequenciaContratacao}
          </Text>
        </View>
      </View>

      {/* Histórico Financeiro */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
          HISTÓRICO FINANCEIRO
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Total de Serviços:</Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
            {score.historico.totalServiços}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Total Faturado:</Text>
          <Text style={{ color: colors.success, fontWeight: "bold" }}>
            {formatarMoeda(score.historico.totalFaturado)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Total Lucro:</Text>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            {formatarMoeda(score.historico.totalLucro)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Margem Média:</Text>
          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
            {(score.historico.margemMedia * 100).toFixed(1)}%
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Inadimplência:</Text>
          <Text style={{ color: score.historico.inadimplenciaPercentual > 20 ? colors.error : colors.success, fontWeight: "bold" }}>
            {score.historico.inadimplenciaPercentual.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Alertas */}
      {score.alertas.length > 0 && (
        <View>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
            ALERTAS
          </Text>
          {score.alertas.map((alerta, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.warning + "20",
                borderLeftWidth: 3,
                borderLeftColor: colors.warning,
                padding: 8,
                marginBottom: 6,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 12 }}>
                {alerta}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
      >
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Score de Cliente
        </Text>

        <FiltroNivel />

        {carregando ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : scores.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 40,
              backgroundColor: colors.surface,
              borderRadius: 12,
            }}
          >
            <MaterialIcons name="people" size={48} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhum cliente avaliado
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              Os scores serão calculados conforme os clientes realizarem serviços
            </Text>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
                {scores.length} CLIENTE{scores.length !== 1 ? "S" : ""} AVALIADO{scores.length !== 1 ? "S" : ""}
              </Text>
            </View>
            {scores.map((score) => (
              <CartaoScore key={score.id} score={score} />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
