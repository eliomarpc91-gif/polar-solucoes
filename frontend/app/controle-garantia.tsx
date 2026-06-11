import React, { useState, useCallback, useEffect } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { obterAnaliseGarantiaMes, analisarGarantiaFinanceira } from "@/lib/financeiro-store";
import type { ControlGarantiaFinanceira } from "@/lib/financeiro-types";

export default function ControleGarantiaScreen() {
  const colors = useColors();
  const [analise, setAnalise] = useState<ControlGarantiaFinanceira | null>(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarAnalise();
    }, [mes, ano])
  );

  const carregarAnalise = async () => {
    setCarregando(true);
    try {
      let dados = await obterAnaliseGarantiaMes(mes, ano);
      if (!dados) {
        dados = await analisarGarantiaFinanceira(mes, ano);
      }
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
      const dados = await analisarGarantiaFinanceira(mes, ano);
      setAnalise(dados);
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

  const MesAnoPicker = () => (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
        PERÍODO
      </Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Pressable
          onPress={() => setMes(mes === 1 ? 12 : mes - 1)}
          style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold" }}>
            {new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </Text>
        </View>

        <Pressable
          onPress={() => setMes(mes === 12 ? 1 : mes + 1)}
          style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
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

  if (!analise) {
    return (
      <ScreenContainer className="p-4">
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Controle de Garantia
        </Text>
        <MesAnoPicker />
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
          <MaterialIcons name="info" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>
            Nenhuma análise disponível
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
            Não há dados de garantia para este período
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
          Controle de Garantia
        </Text>

        <MesAnoPicker />

        {/* Resumo Total */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
            RESUMO FINANCEIRO
          </Text>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total Perdido com Garantia:</Text>
              <Text style={{ color: colors.error, fontWeight: "bold" }}>
                {formatarMoeda(analise.totalPerdidoGarantia)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Custo Retorno Técnico:</Text>
              <Text style={{ color: colors.warning, fontWeight: "bold" }}>
                {formatarMoeda(analise.custoRetornoTecnico)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Custo Peças em Garantia:</Text>
              <Text style={{ color: colors.warning, fontWeight: "bold" }}>
                {formatarMoeda(analise.custoPecasGarantia)}
              </Text>
            </View>
          </View>
        </View>

        {/* Alertas */}
        {analise.alertas.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
              ALERTAS
            </Text>
            {analise.alertas.map((alerta, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.error + "20",
                  borderLeftWidth: 3,
                  borderLeftColor: colors.error,
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 12 }}>
                  {alerta}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Equipamentos com Mais Retorno */}
        {analise.equipamentosComMaisRetorno.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              EQUIPAMENTOS COM MAIS RETORNO
            </Text>
            {analise.equipamentosComMaisRetorno.map((equip, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: idx < analise.equipamentosComMaisRetorno.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View>
                  <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 2 }}>
                    {equip.equipamento}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {equip.quantidade} retorno{equip.quantidade !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Text style={{ color: colors.error, fontWeight: "bold" }}>
                  {formatarMoeda(equip.custo)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Clientes com Mais Garantia */}
        {analise.clientesComMaisGarantia.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
              CLIENTES COM MAIS GARANTIA
            </Text>
            {analise.clientesComMaisGarantia.map((cliente, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: idx < analise.clientesComMaisGarantia.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View>
                  <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 2 }}>
                    {cliente.clienteNome}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {cliente.quantidade} serviço{cliente.quantidade !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Text style={{ color: colors.error, fontWeight: "bold" }}>
                  {formatarMoeda(cliente.custo)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recomendações */}
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
              Recomendações
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            Analise os equipamentos com mais retorno e considere revisar a qualidade do serviço ou o período de garantia.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
