import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { obterAlertas, marcarAlertaComoLido } from "@/lib/financeiro-store";
import { AlertaFinanceiro } from "@/lib/financeiro-types";

export default function AlertasFinanceirosScreen() {
  const colors = useColors();
  const [alertas, setAlertas] = useState<AlertaFinanceiro[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "nao-lidos" | "critico" | "aviso">("nao-lidos");

  useEffect(() => {
    carregarAlertas();
  }, []);

  async function carregarAlertas() {
    const dados = await obterAlertas();
    setAlertas(dados);
  }

  async function marcarComoLido(id: string) {
    await marcarAlertaComoLido(id);
    await carregarAlertas();
  }

  const alertasFiltrados = alertas.filter((a) => {
    switch (filtro) {
      case "nao-lidos":
        return !a.lido;
      case "critico":
        return a.tipo === "critico" && !a.lido;
      case "aviso":
        return a.tipo === "aviso" && !a.lido;
      default:
        return true;
    }
  });

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case "vencimento":
        return "calendar-today";
      case "saldo-baixo":
        return "trending-down";
      case "margem-critica":
        return "warning";
      case "imposto":
        return "receipt";
      case "inadimplencia":
        return "person-off";
      default:
        return "info";
    }
  };

  const getCor = (tipo: string) => {
    switch (tipo) {
      case "critico":
        return colors.error;
      case "aviso":
        return colors.warning;
      case "alerta":
        return colors.primary;
      default:
        return colors.muted;
    }
  };

  const FiltroButton = ({ label, value }: any) => (
    <Pressable
      onPress={() => setFiltro(value)}
      style={({ pressed }) => [{
        backgroundColor: filtro === value ? colors.primary : colors.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: filtro === value ? colors.primary : colors.border,
        opacity: pressed ? 0.7 : 1,
      }]}
    >
      <Text style={{ color: filtro === value ? "#FFFFFF" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Alertas Financeiros
        </Text>

        {/* Resumo */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.error, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>
              {alertas.filter((a) => a.tipo === "critico" && !a.lido).length}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, marginTop: 4 }}>Críticos</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.warning, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>
              {alertas.filter((a) => a.tipo === "aviso" && !a.lido).length}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, marginTop: 4 }}>Avisos</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>
              {alertas.filter((a) => !a.lido).length}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 10, marginTop: 4 }}>Não lidos</Text>
          </View>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <FiltroButton label="Não lidos" value="nao-lidos" />
          <FiltroButton label="Críticos" value="critico" />
          <FiltroButton label="Avisos" value="aviso" />
          <FiltroButton label="Todos" value="todos" />
        </ScrollView>

        {/* Lista de Alertas */}
        {alertasFiltrados.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <MaterialIcons name="check-circle" size={48} color={colors.success} />
            <Text style={{ color: colors.foreground, fontWeight: "bold", marginTop: 12 }}>Nenhum alerta</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Sua situação financeira está sob controle</Text>
          </View>
        ) : (
          alertasFiltrados.map((alerta) => (
            <Pressable
              key={alerta.id}
              onPress={() => marcarComoLido(alerta.id)}
              style={({ pressed }) => [{
                backgroundColor: alerta.lido ? colors.surface : getCor(alerta.tipo) + "20",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: getCor(alerta.tipo),
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <MaterialIcons name={getIcone(alerta.tipo)} size={24} color={getCor(alerta.tipo)} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ color: colors.foreground, fontWeight: "bold", flex: 1 }}>
                      {alerta.titulo}
                    </Text>
                    {!alerta.lido && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getCor(alerta.tipo) }} />
                    )}
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
                    {alerta.mensagem}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>
                    {new Date(alerta.criado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
