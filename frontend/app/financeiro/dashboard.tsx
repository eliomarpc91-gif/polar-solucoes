import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEntradasAutomaticas, getSaidasManuais } from "@/lib/store";
import { calcularResumenMes } from "@/lib/financeiro-automatico-utils";
import { EntradaFinanceira, SaidaFinanceira } from "@/lib/financeiro-automatico-types";

const { width } = Dimensions.get("window");

export default function DashboardFinanceiroScreen() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [entradas, setEntradas] = useState<EntradaFinanceira[]>([]);
  const [saidas, setSaidas] = useState<SaidaFinanceira[]>([]);
  const [resumo, setResumo] = useState<any>(null);

  useEffect(() => {
    carregarDados();
  }, [mes, ano]);

  const carregarDados = async () => {
    const entradasData = await getEntradasAutomaticas();
    const saidasData = await getSaidasManuais();
    setEntradas(entradasData);
    setSaidas(saidasData);

    const resumoData = calcularResumenMes(entradasData, saidasData, mes, ano);
    setResumo(resumoData);
  };

  const mudarMes = (direcao: "anterior" | "proxima") => {
    if (direcao === "anterior") {
      if (mes === 1) {
        setMes(12);
        setAno(ano - 1);
      } else {
        setMes(mes - 1);
      }
    } else {
      if (mes === 12) {
        setMes(1);
        setAno(ano + 1);
      } else {
        setMes(mes + 1);
      }
    }
  };

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  if (!resumo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="hourglass-outline" size={48} color="#d1d5db" />
        <Text style={{ marginTop: 12, color: "#9ca3af" }}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header com Seleção de Mês */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <TouchableOpacity onPress={() => mudarMes("anterior")}>
              <Ionicons name="chevron-back" size={24} color="#1B4F72" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1B4F72" }}>
              {nomesMeses[mes - 1]} {ano}
            </Text>
            <TouchableOpacity onPress={() => mudarMes("proxima")}>
              <Ionicons name="chevron-forward" size={24} color="#1B4F72" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards de Resumo */}
        <View style={{ padding: 16, gap: 12 }}>
          {/* Total de Entradas */}
          <View
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#16A34A",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Total de Entradas</Text>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "#16A34A" }}>
                  R$ {resumo.totalEntradas.toFixed(2)}
                </Text>
              </View>
              <Ionicons name="arrow-up-circle" size={32} color="#16A34A" />
            </View>
          </View>

          {/* Total de Saídas */}
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#EF4444",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Total de Saídas</Text>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "#EF4444" }}>
                  R$ {resumo.totalSaidas.toFixed(2)}
                </Text>
              </View>
              <Ionicons name="arrow-down-circle" size={32} color="#EF4444" />
            </View>
          </View>

          {/* Lucro Líquido */}
          <View
            style={{
              backgroundColor: "#1B4F72",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ fontSize: 12, color: "#93C5FD", marginBottom: 4 }}>Lucro Líquido</Text>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
                  R$ {resumo.lucroLiquido.toFixed(2)}
                </Text>
              </View>
              <Ionicons name="trending-up" size={32} color="#fff" />
            </View>
          </View>
        </View>

        {/* Indicadores */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1B4F72", marginBottom: 12 }}>
            Indicadores do Mês
          </Text>
          <View style={{ gap: 8 }}>
            {/* Contas a Receber */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#FEF3C7", borderRadius: 8, padding: 8 }}>
                  <Ionicons name="hourglass-outline" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>Contas a Receber</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827" }}>
                    R$ {resumo.contasAReceber.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contas Pagas */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#DBEAFE", borderRadius: 8, padding: 8 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>Contas Pagas</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827" }}>
                    {resumo.contasPagas}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contas Pendentes */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#FECACA", borderRadius: 8, padding: 8 }}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>Contas Pendentes</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827" }}>
                    {resumo.contasPendentes}
                  </Text>
                </View>
              </View>
            </View>

            {/* Orçamentos Aprovados */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, padding: 8 }}>
                  <Ionicons name="document-text" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>Orçamentos Aprovados</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827" }}>
                    {resumo.orcamentosAprovados}
                  </Text>
                </View>
              </View>
            </View>

            {/* OS Finalizadas */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "#E0E7FF", borderRadius: 8, padding: 8 }}>
                  <Ionicons name="checkmark-done" size={20} color="#4F46E5" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>OS Finalizadas</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827" }}>
                    {resumo.osFinalizadas}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Últimas Transações */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1B4F72", marginBottom: 12 }}>
            Últimas Transações
          </Text>
          <View style={{ gap: 8 }}>
            {resumo.entradas.slice(0, 3).map((entrada: EntradaFinanceira) => (
              <View
                key={entrada.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#F9FAFB",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }}>
                    {entrada.descricao}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                    {entrada.clienteNome}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: "#16A34A" }}>
                  +R$ {entrada.valorRecebido.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
