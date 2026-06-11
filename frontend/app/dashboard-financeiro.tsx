import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterFluxoDeCaixaMes, obterContasPagar, obterContasReceber } from "@/lib/financeiro-store";
import { FluxoDeCaixa, ContaPagar, ContaReceber } from "@/lib/financeiro-types";

export default function DashboardFinanceiroScreen() {
  const colors = useColors();
  const [fluxo, setFluxo] = useState<FluxoDeCaixa[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const [f, cp, cr] = await Promise.all([
      obterFluxoDeCaixaMes(mesAtual, anoAtual),
      obterContasPagar(),
      obterContasReceber(),
    ]);
    setFluxo(f);
    setContasPagar(cp);
    setContasReceber(cr);
  }

  const saldoTotal = fluxo.length > 0 ? fluxo[fluxo.length - 1].saldoDia : 0;
  const receitas = fluxo.reduce((sum, f) => sum + f.entradas, 0);
  const despesas = fluxo.reduce((sum, f) => sum + f.saidas, 0);
  const lucroLiquido = receitas - despesas;

  const contasPagarPendentes = contasPagar.filter((c) => c.status !== "pago").reduce((sum, c) => sum + c.valor, 0);
  const contasReceberPendentes = contasReceber.reduce((sum, c) => sum + c.saldoRestante, 0);

  const margemLiquida = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

  const CardMetrica = ({ titulo, valor, cor, icone }: any) => (
    <View
      style={{
        backgroundColor: cor,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View>
        <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.8 }}>{titulo}</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "bold", marginTop: 4 }}>
          {typeof valor === "number" ? `R$ ${valor.toFixed(2)}` : `${valor.toFixed(1)}%`}
        </Text>
      </View>
      <MaterialIcons name={icone} size={40} color="#FFFFFF" style={{ opacity: 0.3 }} />
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Dashboard Financeiro
        </Text>

        {/* Métricas Principais */}
        <CardMetrica titulo="SALDO TOTAL" valor={saldoTotal} cor={colors.primary} icone="account-balance-wallet" />
        <CardMetrica titulo="RECEITAS" valor={receitas} cor={colors.success} icone="trending-up" />
        <CardMetrica titulo="DESPESAS" valor={despesas} cor={colors.error} icone="trending-down" />
        <CardMetrica titulo="LUCRO LÍQUIDO" valor={lucroLiquido} cor={lucroLiquido >= 0 ? "#16A34A" : colors.error} icone="attach-money" />
        <CardMetrica titulo="MARGEM LÍQUIDA" valor={margemLiquida} cor={margemLiquida >= 20 ? "#16A34A" : colors.warning} icone="percent" />

        {/* Contas a Pagar */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 20, marginBottom: 12 }}>
          Contas a Pagar
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: colors.error,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total a Pagar</Text>
              <Text style={{ color: colors.error, fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
                R$ {contasPagarPendentes.toFixed(2)}
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {contasPagar.filter((c) => c.status !== "pago").length} contas
            </Text>
          </View>
        </View>

        {/* Contas a Receber */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
          Contas a Receber
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Total a Receber</Text>
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
                R$ {contasReceberPendentes.toFixed(2)}
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {contasReceber.filter((c) => c.status !== "pago").length} contas
            </Text>
          </View>
        </View>

        {/* Fluxo de Caixa Recente */}
        <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 20, marginBottom: 12 }}>
          Movimentações Recentes
        </Text>
        {fluxo.slice(0, 5).map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>Fluxo do Dia</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.data}</Text>
            </View>
            <Text
              style={{
                color: item.saldoDia >= 0 ? colors.success : colors.error,
                fontWeight: "bold",
              }}
            >
              R$ {item.saldoDia.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Análise de Saúde Financeira */}
        <View style={{ marginTop: 20, marginBottom: 30 }}>
          <Text style={{ color: colors.foreground, fontWeight: "bold", marginBottom: 12 }}>
            Saúde Financeira
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialIcons name={margemLiquida >= 20 ? "check-circle" : "warning"} size={20} color={margemLiquida >= 20 ? colors.success : colors.warning} />
              <Text style={{ color: colors.foreground, marginLeft: 8, fontWeight: "600" }}>
                Margem Líquida: {margemLiquida.toFixed(1)}%
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialIcons
                name={saldoTotal > contasPagarPendentes ? "check-circle" : "error"}
                size={20}
                color={saldoTotal > contasPagarPendentes ? colors.success : colors.error}
              />
              <Text style={{ color: colors.foreground, marginLeft: 8, fontWeight: "600" }}>
                Saldo vs Contas a Pagar
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name={lucroLiquido > 0 ? "trending-up" : "trending-down"} size={20} color={lucroLiquido > 0 ? colors.success : colors.error} />
              <Text style={{ color: colors.foreground, marginLeft: 8, fontWeight: "600" }}>
                Lucro: {lucroLiquido > 0 ? "Positivo" : "Negativo"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
