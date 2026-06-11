import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { obterFluxoDeCaixa, obterLucratividade, obterAnaliseFinanceiraIA, analisarEmpresaEmRisco } from "@/lib/financeiro-store";

export default function DashboardEmpresarialScreen() {
  const colors = useColors();
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const fluxo = await obterFluxoDeCaixa(hoje.split("-").slice(0, 2).join("-"));
      const lucratividade = await obterLucratividade();
      const analiseIAs = await obterAnaliseFinanceiraIA(5, 2026);
      const risco = await analisarEmpresaEmRisco();

      const totalFaturado = lucratividade.reduce((sum: number, l: any) => sum + l.valorCobrado, 0);
      const totalLucro = lucratividade.reduce((sum: number, l: any) => sum + l.lucroLiquido, 0);
      const totalCustos = lucratividade.reduce((sum: number, l: any) => sum + (l.custoMaterial + l.deslocamento + l.hh + l.ajudante), 0);

      setDados({
        saldoAtual: fluxo?.saldoDia || 0,
        totalFaturado,
        totalLucro,
        totalCustos,
        margemMedia: totalFaturado > 0 ? (totalLucro / totalFaturado) * 100 : 0,
        servicosRealizados: lucratividade.length,
        analiseIA: analiseIAs,
        risco,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const CartaoMetrica = ({ icon, label, valor, cor, onPress }: any) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: cor,
        opacity: pressed ? 0.8 : 1,
      }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ backgroundColor: cor + "20", borderRadius: 8, padding: 10 }}>
          <MaterialIcons name={icon} size={24} color={cor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
            {label}
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>
            {valor}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (carregando || !dados) {
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold" }}>
            Dashboard
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 8 }}>
            <MaterialIcons name="refresh" size={20} color={colors.primary} />
          </View>
        </View>

        {/* Status Geral */}
        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <MaterialIcons name="trending-up" size={20} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
              Saúde Financeira
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 16 }}>
            Seu negócio está operando normalmente. Continue acompanhando os indicadores para manter a saúde financeira.
          </Text>
        </View>

        {/* Métricas Principais */}
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
          INDICADORES PRINCIPAIS
        </Text>

        <CartaoMetrica
          icon="account-balance-wallet"
          label="Saldo em Caixa"
          valor={formatarMoeda(dados.saldoAtual)}
          cor={dados.saldoAtual > 0 ? colors.success : colors.error}
          onPress={() => router.push("/fluxo-caixa")}
        />

        <CartaoMetrica
          icon="trending-up"
          label="Total Faturado"
          valor={formatarMoeda(dados.totalFaturado)}
          cor={colors.success}
          onPress={() => router.push("/lucratividade-servicos")}
        />

        <CartaoMetrica
          icon="trending-up"
          label="Lucro Total"
          valor={formatarMoeda(dados.totalLucro)}
          cor={colors.primary}
          onPress={() => router.push("/analise-ia")}
        />

        <CartaoMetrica
          icon="percent"
          label="Margem Média"
          valor={`${dados.margemMedia.toFixed(1)}%`}
          cor={dados.margemMedia > 30 ? colors.success : colors.warning}
          onPress={() => router.push("/lucratividade-servicos")}
        />

        <CartaoMetrica
          icon="build"
          label="Serviços Realizados"
          valor={dados.servicosRealizados.toString()}
          cor={colors.primary}
          onPress={() => router.push("/os")}
        />

        {/* Análise IA */}
        {dados.analiseIA && (
          <>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12, marginTop: 8 }}>
              ANÁLISE IA
            </Text>
            <Pressable
              onPress={() => router.push("/analise-ia")}
              style={({ pressed }) => [{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              }]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                  Score de Saúde Financeira
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                    width: 50,
                    height: 50,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                    {Math.round(dados.analiseIA.score)}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {dados.analiseIA.status}
              </Text>
            </Pressable>
          </>
        )}

        {/* Risco */}
        {dados.risco && (
          <>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12 }}>
              ANÁLISE DE RISCO
            </Text>
            <Pressable
              onPress={() => router.push("/empresa-risco")}
              style={({ pressed }) => [{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: dados.risco.risco === "baixo" ? colors.success : colors.warning,
                opacity: pressed ? 0.8 : 1,
              }]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                    Nível de Risco
                  </Text>
                  <Text
                    style={{
                      color: dados.risco.risco === "baixo" ? colors.success : colors.warning,
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                  >
                    {dados.risco.risco}
                  </Text>
                </View>
                <MaterialIcons
                  name={dados.risco.risco === "baixo" ? "check-circle" : "warning"}
                  size={28}
                  color={dados.risco.risco === "baixo" ? colors.success : colors.warning}
                />
              </View>
            </Pressable>
          </>
        )}

        {/* Ações Rápidas */}
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 12, marginTop: 8 }}>
          AÇÕES RÁPIDAS
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <Pressable
            onPress={() => router.push("/os")}
            style={({ pressed }) => [{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
                Nova OS
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/alertas-financeiros")}
            style={({ pressed }) => [{
              flex: 1,
              backgroundColor: colors.warning + "20",
              borderRadius: 8,
              paddingVertical: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <MaterialIcons name="warning" size={20} color={colors.warning} />
              <Text style={{ color: colors.warning, fontWeight: "bold", fontSize: 12 }}>
                Alertas
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/relatorios-financeiros")}
            style={({ pressed }) => [{
              flex: 1,
              backgroundColor: colors.primary + "20",
              borderRadius: 8,
              paddingVertical: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <MaterialIcons name="description" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 12 }}>
                Relatórios
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
