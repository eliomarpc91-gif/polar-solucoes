import React, { useState, useCallback, useEffect } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { obterAnalisesPrejuizoOcultoComFiltro } from "@/lib/financeiro-store";
import type { PrejuizoOcultoAnalise } from "@/lib/financeiro-types";

export default function PrejuizoOcultoScreen() {
  const colors = useColors();
  const [analises, setAnalises] = useState<PrejuizoOcultoAnalise[]>([]);
  const [filtroSeveridade, setFiltroSeveridade] = useState<string | undefined>();
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarAnalises();
    }, [filtroSeveridade])
  );

  const carregarAnalises = async () => {
    setCarregando(true);
    try {
      const dados = await obterAnalisesPrejuizoOcultoComFiltro(filtroSeveridade);
      setAnalises(dados);
    } catch (error) {
      console.error("Erro ao carregar análises:", error);
    } finally {
      setCarregando(false);
    }
  };

  const aoAtualizar = async () => {
    setAtualizando(true);
    await carregarAnalises();
    setAtualizando(false);
  };

  const getSeveridadeColor = (severidade: string) => {
    switch (severidade) {
      case "critica":
        return colors.error;
      case "alta":
        return "#FF9800";
      case "media":
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getSeveridadeIcon = (severidade: string) => {
    switch (severidade) {
      case "critica":
        return "error";
      case "alta":
        return "warning";
      case "media":
        return "info";
      default:
        return "check-circle";
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const FiltroSeveridade = () => (
    <View style={{ marginBottom: 16, gap: 8 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
        FILTRAR POR SEVERIDADE
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {["critica", "alta", "media", "baixa"].map((sev) => (
          <Pressable
            key={sev}
            onPress={() => setFiltroSeveridade(filtroSeveridade === sev ? undefined : sev)}
            style={({ pressed }) => [{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: filtroSeveridade === sev ? getSeveridadeColor(sev) : colors.surface,
              borderWidth: 1,
              borderColor: getSeveridadeColor(sev),
              opacity: pressed ? 0.7 : 1,
            }]}
          >
            <Text
              style={{
                color: filtroSeveridade === sev ? "white" : getSeveridadeColor(sev),
                fontSize: 12,
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {sev}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const CartaoAnalise = ({ analise }: { analise: PrejuizoOcultoAnalise }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: getSeveridadeColor(analise.severidade),
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Cabeçalho */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <View
          style={{
            backgroundColor: getSeveridadeColor(analise.severidade) + "20",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <MaterialIcons
            name={getSeveridadeIcon(analise.severidade) as any}
            size={20}
            color={getSeveridadeColor(analise.severidade)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 4 }}>
            {analise.servicoDescricao}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {analise.clienteNome}
          </Text>
        </View>
        <Text
          style={{
            color: getSeveridadeColor(analise.severidade),
            fontWeight: "bold",
            fontSize: 12,
            textTransform: "capitalize",
          }}
        >
          {analise.severidade}
        </Text>
      </View>

      {/* Valores */}
      <View style={{ backgroundColor: colors.border + "20", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Lucro Previsto:</Text>
          <Text style={{ color: colors.success, fontWeight: "bold" }}>
            {formatarMoeda(analise.lucroPrevisto)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Lucro Real:</Text>
          <Text style={{ color: analise.lucroReal < 0 ? colors.error : colors.foreground, fontWeight: "bold" }}>
            {formatarMoeda(analise.lucroReal)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "bold" }}>Diferença:</Text>
          <Text
            style={{
              color: analise.diferenca < 0 ? colors.error : colors.success,
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            {formatarMoeda(analise.diferenca)} ({analise.percentualDiferenca.toFixed(1)}%)
          </Text>
        </View>
      </View>

      {/* Causas */}
      {analise.causas.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
            CAUSAS IDENTIFICADAS
          </Text>
          {analise.causas.map((causa, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <MaterialIcons name="circle" size={6} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {causa}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Alertas */}
      {analise.alertas.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
            ALERTAS
          </Text>
          {analise.alertas.map((alerta, idx) => (
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

      {/* Recomendações */}
      {analise.recomendacoes.length > 0 && (
        <View>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
            RECOMENDAÇÕES
          </Text>
          {analise.recomendacoes.map((rec, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.primary + "20",
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
                padding: 8,
                marginBottom: 6,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 12 }}>
                {rec}
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
          Prejuízo Oculto
        </Text>

        <FiltroSeveridade />

        {carregando ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : analises.length === 0 ? (
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
            <MaterialIcons name="check-circle" size={48} color={colors.success} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
              Nenhum prejuízo oculto detectado
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              Seus serviços estão saudáveis financeiramente
            </Text>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
                {analises.length} SERVIÇO{analises.length !== 1 ? "S" : ""} COM PREJUÍZO OCULTO
              </Text>
            </View>
            {analises.map((analise) => (
              <CartaoAnalise key={analise.id} analise={analise} />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
